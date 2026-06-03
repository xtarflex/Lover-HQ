/**
 * @file useDailyQuestion.js
 * @description Hook that encapsulates the logic for selecting and
 * initializing the daily Reveal question for a couple.
 */

import { useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import promptsData from '../prompts.json';

/**
 * Computes a stable, unique numeric seed for a couple based on their user IDs.
 * Sorting the IDs ensures the same seed is produced regardless of argument order.
 *
 * @param {string} uid1 - First user ID.
 * @param {string} uid2 - Second user ID.
 * @returns {number} A positive integer seed derived from both IDs.
 */
export const getCoupleSeed = (uid1, uid2) => {
  const combined = [uid1, uid2].sort().join('');
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

/**
 * Hook that exposes an `initializeDailyQuestion` callback for selecting and
 * persisting the couple's daily Reveal question.
 *
 * The selection priority is:
 * 1. A custom question manually scheduled for today's date.
 * 2. A random unscheduled custom question (based on the mix-frequency setting).
 * 3. A stable default prompt derived from the couple seed + day-of-year.
 *
 * Race conditions on insert (when both partners load simultaneously) are handled
 * by falling back to a `.select()` query when the insert reports a conflict.
 *
 * @param {{ userId: string, partnerId: string, coupleKey: string, todayStr: string }} params
 * @returns {{ initializeDailyQuestion: () => Promise<Object> }}
 */
export function useDailyQuestion({ userId, partnerId, coupleKey, todayStr }) {
  /**
   * Selects and inserts the daily question row for the couple.
   *
   * @returns {Promise<Object>} The inserted or existing `reveal_daily_question` row.
   */
  const initializeDailyQuestion = useCallback(async () => {
    // 1. Check if there is a custom question manually scheduled for today
    const { data: scheduled, error: schedError } = await supabase
      .from('reveal_questions')
      .select('*')
      .or(`user_id.eq.${userId},user_id.eq.${partnerId}`)
      .eq('scheduled_for_date', todayStr)
      .maybeSingle();

    if (!schedError && scheduled) {
      // Create active question row
      const newDaily = {
        user_id: coupleKey,
        question_id: `custom-${scheduled.id}`,
        content: scheduled.content,
        category: scheduled.category || 'general',
        active_date: todayStr,
      };

      const { data: inserted, error: insError } = await supabase
        .from('reveal_daily_question')
        .insert(newDaily)
        .select()
        .single();

      if (!insError) return inserted;
    }

    // 2. Query configurations settings to see if custom questions are mixed automatically
    const mixFreq = parseInt(localStorage.getItem('reveal_custom_question_freq') || '25', 10);
    const shouldTryCustom = mixFreq > 0 && Math.random() * 100 < mixFreq;

    if (shouldTryCustom) {
      // Find an unscheduled/unused custom question
      const { data: unusedCustoms } = await supabase
        .from('reveal_questions')
        .select('*')
        .or(`user_id.eq.${userId},user_id.eq.${partnerId}`)
        .is('scheduled_for_date', null)
        .limit(10);

      if (unusedCustoms && unusedCustoms.length > 0) {
        // Pick one randomly
        const selected = unusedCustoms[Math.floor(Math.random() * unusedCustoms.length)];

        // Mark it as scheduled so it isn't picked again
        await supabase
          .from('reveal_questions')
          .update({ scheduled_for_date: todayStr })
          .eq('id', selected.id);

        const newDaily = {
          user_id: coupleKey,
          question_id: `custom-${selected.id}`,
          content: selected.content,
          category: selected.category || 'general',
          active_date: todayStr,
        };

        const { data: inserted, error: insError } = await supabase
          .from('reveal_daily_question')
          .insert(newDaily)
          .select()
          .single();

        if (!insError) return inserted;
      }
    }

    // 3. Fallback: Select stable default question using couple seed
    const coupleSeed = getCoupleSeed(userId, partnerId);
    const todayObj = new Date();
    const dayOfYear = Math.floor((todayObj - new Date(todayObj.getFullYear(), 0, 0)) / 86400000);
    const promptIndex = (dayOfYear + coupleSeed) % promptsData.length;
    const selectedPrompt = promptsData[promptIndex];

    const newDaily = {
      user_id: coupleKey,
      question_id: `default-${selectedPrompt.id}`,
      content: selectedPrompt.content,
      category: selectedPrompt.category,
      active_date: todayStr,
    };

    const { data: inserted, error: insError } = await supabase
      .from('reveal_daily_question')
      .insert(newDaily)
      .select()
      .single();

    if (insError) {
      // In case of race condition (partner already created the row just now)
      const { data: existing } = await supabase
        .from('reveal_daily_question')
        .select('*')
        .eq('user_id', coupleKey)
        .eq('active_date', todayStr)
        .single();
      if (existing) return existing;
      throw insError;
    }

    return inserted;
  }, [userId, partnerId, coupleKey, todayStr]);

  return { initializeDailyQuestion };
}

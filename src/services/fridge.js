/**
 * @file src/services/fridge.js
 * @description Service layer encapsulating Supabase database and storage interactions for the Fridge feature.
 */

import { supabase } from '../lib/supabase';

/**
 * Fetches all fridge items for the given user and optionally their partner.
 * Items are returned sorted by updated_at ascending.
 *
 * @param {string} userId - The current user's ID.
 * @param {string} [partnerId] - The partner's ID (optional).
 * @returns {Promise<Array<object>>} A promise that resolves to the array of fridge items.
 * @throws {Error} If the database query fails.
 */
export async function getFridgeItems(userId, partnerId) {
  let query = supabase.from('fridge_items').select('*');
  if (partnerId) {
    query = query.or(`user_id.eq.${userId},user_id.eq.${partnerId}`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.order('updated_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Creates a new fridge item.
 *
 * @param {object} item - The fridge item object to insert.
 * @param {string} item.user_id - The ID of the user creating the item.
 * @param {string} item.type - The type of item ('note', 'photo', 'voice').
 * @param {string} item.content - The content of the item (text or URL, stringified JSON if needed).
 * @param {number} item.x_position - Horizontal coordinate as percentage.
 * @param {number} item.y_position - Vertical coordinate as percentage.
 * @returns {Promise<object>} A promise that resolves to the inserted item.
 * @throws {Error} If the database insert fails.
 */
export async function createFridgeItem(item) {
  const { data, error } = await supabase.from('fridge_items').insert(item).select().single();

  if (error) throw error;
  return data;
}

/**
 * Updates an existing fridge item.
 *
 * @param {string} id - The ID of the item to update.
 * @param {object} updates - The fields to update (e.g. x_position, y_position, content, updated_at).
 * @returns {Promise<object>} A promise that resolves to the updated item.
 * @throws {Error} If the database update fails.
 */
export async function updateFridgeItem(id, updates) {
  const { data, error } = await supabase
    .from('fridge_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deletes a fridge item.
 *
 * @param {string} id - The ID of the item to delete.
 * @returns {Promise<void>} A promise that resolves when deletion is complete.
 * @throws {Error} If the database deletion fails.
 */
export async function deleteFridgeItem(id) {
  const { error } = await supabase.from('fridge_items').delete().eq('id', id);

  if (error) throw error;
}

/**
 * Counts the number of fridge items for the given user and partner.
 *
 * @param {string} userId - The current user's ID.
 * @param {string} [partnerId] - The partner's ID (optional).
 * @returns {Promise<number>} A promise that resolves to the count of fridge items.
 * @throws {Error} If the database query fails.
 */
export async function getFridgeItemsCount(userId, partnerId) {
  let query = supabase.from('fridge_items').select('id', { count: 'exact', head: true });
  if (partnerId) {
    query = query.or(`user_id.eq.${userId},user_id.eq.${partnerId}`);
  } else {
    query = query.eq('user_id', userId);
  }

  const { count, error } = await query;
  if (error) throw error;
  return count || 0;
}

/**
 * Fetches fridge items older than a cutoff date (used for compaction).
 *
 * @param {Array<string>} userIds - The user IDs to fetch items for.
 * @param {string} cutOffIso - ISO timestamp threshold.
 * @returns {Promise<Array<object>>} A promise that resolves to the list of items to delete.
 * @throws {Error} If the database query fails.
 */
export async function getFridgeItemsBeforeCutoff(userIds, cutOffIso) {
  const { data, error } = await supabase
    .from('fridge_items')
    .select('*')
    .in('user_id', userIds)
    .lt('created_at', cutOffIso)
    .eq('is_pinned', false);

  if (error) throw error;
  return data || [];
}

/**
 * Deletes fridge items older than a cutoff date (used for compaction).
 *
 * @param {Array<string>} userIds - The user IDs to delete items for.
 * @param {string} cutOffIso - ISO timestamp threshold.
 * @returns {Promise<void>} A promise that resolves when deletion is complete.
 * @throws {Error} If the database deletion fails.
 */
export async function deleteFridgeItemsBeforeCutoff(userIds, cutOffIso) {
  const { error } = await supabase
    .from('fridge_items')
    .delete()
    .in('user_id', userIds)
    .lt('created_at', cutOffIso)
    .eq('is_pinned', false);

  if (error) throw error;
}

/**
 * Checks for fridge items newer than a timestamp (used for bottom navigation badge).
 *
 * @param {string} userId - The current user's ID.
 * @param {string} [partnerId] - The partner's ID (optional).
 * @param {string} timestamp - ISO timestamp to check against.
 * @returns {Promise<Array<object>>} A promise that resolves to the list of new items.
 * @throws {Error} If the database query fails.
 */
export async function getFridgeItemsNewerThan(userId, partnerId, timestamp) {
  if (!partnerId) return [];

  const { data, error } = await supabase
    .from('fridge_items')
    .select('id, updated_at')
    .eq('user_id', partnerId)
    .gt('updated_at', timestamp);

  if (error) throw error;
  return data || [];
}

/**
 * Uploads a file to the fridge-media Supabase storage bucket.
 *
 * @param {string} filePath - Path where the file should be saved in the bucket.
 * @param {Blob|File} fileBlob - The binary data to upload.
 * @param {object} [options] - Optional bucket upload options.
 * @returns {Promise<object>} A promise that resolves with the upload result data.
 * @throws {Error} If the upload fails.
 */
export async function uploadFridgeMedia(filePath, fileBlob, options) {
  const { data, error } = await supabase.storage
    .from('fridge-media')
    .upload(filePath, fileBlob, options);

  if (error) throw error;
  return data;
}

/**
 * Deletes files from the fridge-media Supabase storage bucket.
 *
 * @param {Array<string>} filePaths - Array of file paths to remove from the bucket.
 * @returns {Promise<void>} A promise that resolves when files are deleted.
 * @throws {Error} If deletion fails.
 */
export async function deleteFridgeMedia(filePaths) {
  const { error } = await supabase.storage.from('fridge-media').remove(filePaths);

  if (error) throw error;
}

/**
 * Gets the public URL for a file in the fridge-media bucket.
 *
 * @param {string} filePath - The path of the file in the bucket.
 * @returns {string} The public URL.
 */
export function getFridgeMediaPublicUrl(filePath) {
  const { data } = supabase.storage.from('fridge-media').getPublicUrl(filePath);

  return data.publicUrl;
}

/**
 * Fetches all comments for a specific fridge item.
 * Comments are returned sorted by created_at ascending.
 *
 * @param {string} itemId - The ID of the parent fridge item.
 * @returns {Promise<Array<object>>} A promise resolving to the list of comments.
 * @throws {Error} If the query fails.
 */
export async function getFridgeComments(itemId) {
  const { data, error } = await supabase
    .from('fridge_comments')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Creates a new comment for a fridge item.
 *
 * @param {object} comment - The comment data to insert.
 * @param {string} comment.item_id - The parent item's ID.
 * @param {string} comment.user_id - The ID of the author.
 * @param {string} comment.content - The text content of the comment.
 * @returns {Promise<object>} A promise resolving to the inserted comment.
 * @throws {Error} If the insert fails.
 */
/**
 * Creates multiple comments for fridge items in bulk.
 *
 * @param {Array<object>} comments - The array of comment data to insert.
 * @returns {Promise<Array<object>>} A promise resolving to the inserted comments.
 * @throws {Error} If the bulk insert fails.
 */
export async function createFridgeComments(comments) {
  const { data, error } = await supabase.from('fridge_comments').insert(comments).select();

  if (error) throw error;
  return data;
}

export async function createFridgeComment(comment) {
  const { data, error } = await supabase.from('fridge_comments').insert(comment).select().single();

  if (error) throw error;
  return data;
}

/**
 * Deletes a comment by ID.
 *
 * @param {string} commentId - The ID of the comment to delete.
 * @returns {Promise<void>}
 * @throws {Error} If the deletion fails.
 */
export async function deleteFridgeComment(commentId) {
  const { error } = await supabase.from('fridge_comments').delete().eq('id', commentId);

  if (error) throw error;
}

/**
 * Updates the reactions JSONB payload on a fridge item.
 *
 * @param {string} itemId - The ID of the item.
 * @param {object} reactions - The reactions object mapping (e.g. { heart: [userId1, userId2] }).
 * @returns {Promise<object>} A promise resolving to the updated fridge item.
 * @throws {Error} If the update fails.
 */
export async function updateFridgeItemReactions(itemId, reactions) {
  const { data, error } = await supabase
    .from('fridge_items')
    .update({ reactions })
    .eq('id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

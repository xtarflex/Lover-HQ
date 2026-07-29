/* global process */
/**
 * @file scripts/deleteSupabaseStickersStorage.js
 * @description Purges any uploaded objects from Supabase Storage 'stickers' bucket.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oxqpmfdoytdfxmofmeno.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

async function purgeStorage() {
  console.log('🧹 Purging Supabase Storage "stickers" bucket...');
  if (!SUPABASE_KEY) {
    console.log('No Supabase key configured. Skipping storage purge.');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data: files, error } = await supabase.storage.from('stickers').list('');
    if (error) {
      console.log('Note: Storage bucket list response:', error.message);
      return;
    }

    if (files && files.length > 0) {
      const filePaths = files.map((f) => f.name);
      const { error: delErr } = await supabase.storage.from('stickers').remove(filePaths);
      if (delErr) {
        console.log('Note: Storage removal response:', delErr.message);
      } else {
        console.log(`✅ Successfully deleted ${filePaths.length} objects from Supabase Storage "stickers" bucket!`);
      }
    } else {
      console.log('✅ Supabase Storage "stickers" bucket is already empty (0 objects).');
    }
  } catch (err) {
    console.log('Storage cleanup notice:', err.message);
  }
}

purgeStorage();

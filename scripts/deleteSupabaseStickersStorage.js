/* global process */
/**
 * @file scripts/deleteSupabaseStickersStorage.js
 * @description Purges objects and deletes the 'stickers' storage bucket in Supabase.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oxqpmfdoytdfxmofmeno.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94cXBtZmRveXRkZnhtb2ZtZW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDYwMTMsImV4cCI6MjA5NDA4MjAxM30.RmV-qEqQVjEQzzBoZZVVQrmKr_eRyH2t2jBTP29QwVo';

async function deleteBucket() {
  console.log('🗑️ Attempting to delete Supabase Storage "stickers" bucket...');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { data: files } = await supabase.storage.from('stickers').list('');
    if (files && files.length > 0) {
      const filePaths = files.map((f) => f.name);
      await supabase.storage.from('stickers').remove(filePaths);
    }

    const { data, error } = await supabase.storage.deleteBucket('stickers');
    if (error) {
      console.log('Note (Storage Bucket API):', error.message);
    } else {
      console.log('✅ Successfully deleted "stickers" storage bucket from Supabase!', data);
    }
  } catch (err) {
    console.log('Bucket deletion note:', err.message);
  }
}

deleteBucket();

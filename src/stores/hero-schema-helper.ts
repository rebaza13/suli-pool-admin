// ============================================
// Hero Schema Helper - Discovers actual column names
// ============================================
// Run this in browser console to discover the actual schema:
// 
// import { supabase } from 'src/boot/supabase';
// const { data } = await supabase.from('hero_slides').select('*').limit(1);
// console.log('Hero Slides Columns:', data?.[0] ? Object.keys(data[0]) : 'No data');
//
// Or check in Supabase SQL Editor:
// SELECT column_name FROM information_schema.columns WHERE table_name = 'hero_slides';

// Update these based on your actual database schema:
export const HERO_SLIDES_COLUMNS = {
  order: 'sort_order',
  isEnabled: 'is_enabled',
  createdAt: 'created_at',
} as const;


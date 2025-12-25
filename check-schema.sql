-- Run this in Supabase SQL Editor to check the actual table structure
-- This prints ALL tables + columns in the public schema.

-- List all tables (and views) in public schema
SELECT
  table_type,
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_type, table_name;

-- List all columns for all tables in public schema
SELECT
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- If you only care about the hero/media tables used by this app, uncomment:
-- AND table_name IN (
--   'hero_slides',
--   'hero_slide_translations',
--   'hero_slide_images',
--   'media_assets'
-- )


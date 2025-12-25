# Discover Database Schema

If you want me to tell you **exactly which columns your Supabase tables have**, run the SQL below in **Supabase → SQL Editor** and paste the results here.

```sql
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
```

Notes:
- This app expects these tables: `hero_slides`, `hero_slide_translations`, `hero_slide_images`, `media_assets`
- Common alternatives for ordering columns (if your table differs): `order`, `sort_order`, `position`, `sequence`, `display_order`, `order_index`


-- Enable RLS policies for Installation + Timeline tables
-- Requirement: no user_id ownership checks; any authenticated user can CRUD.
-- This script is SAFE to run even if some tables do not exist.
-- Run this in Supabase SQL Editor.

DO $$
DECLARE
  t text;
  p_read text;
  p_insert text;
  p_update text;
  p_delete text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    -- Installation (your current schema)
    'installations',
    'installation_translations',
    'installation_images',

    -- Other possible naming variants
    'installation_steps',
    'installation_step_translations',
    'installation_items',
    'installation_item_translations',

    -- Timeline variants
    'timeline_items',
    'timeline_item_translations',
    'timeline_item_images',
    'timeline_events',
    'timeline_event_translations',
    'timeline_event_images',

    -- Why We Different
    'why_we_different',
    'why_we_different_translations',

    -- About Section
    'about_section',
    'about_section_translations',
    'about_section_images',

    -- Company Statistics
    'company_statistics',

    -- Projects
    'projects',
    'project_translations',
    'project_images',

    -- Locations
    'locations',
    'location_translations'
  ]
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

      p_read := 'Allow authenticated users to read ' || t;
      p_insert := 'Allow authenticated users to insert ' || t;
      p_update := 'Allow authenticated users to update ' || t;
      p_delete := 'Allow authenticated users to delete ' || t;

      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_read, t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_insert, t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_update, t);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p_delete, t);

      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', p_read, t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', p_insert, t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (true) WITH CHECK (true)', p_update, t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (true)', p_delete, t);
    END IF;
  END LOOP;
END $$;



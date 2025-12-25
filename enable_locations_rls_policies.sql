-- Enable RLS policies for Locations tables
-- Requirement: no user_id ownership checks; any authenticated user can CRUD.
-- Run this in Supabase SQL Editor.

-- This script supports both table naming variants:
-- - public.location OR public.locations
-- - public.location_translations OR public.locations_translations

DO $$
DECLARE
  t text;
  p_read text;
  p_insert text;
  p_update text;
  p_delete text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'location',
    'locations',
    'location_translations',
    'locations_translations',
    'location_translation'
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



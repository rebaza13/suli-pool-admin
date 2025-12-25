-- Create Installation + Timeline tables for Suli Pool Admin
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Installation Steps
-- ============================================

CREATE TABLE IF NOT EXISTS public.installation_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS installation_steps_sort_order_idx
  ON public.installation_steps (sort_order);

CREATE TABLE IF NOT EXISTS public.installation_step_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installation_step_id uuid NOT NULL REFERENCES public.installation_steps(id) ON DELETE CASCADE,
  locale text NOT NULL,
  title text NOT NULL,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT installation_step_translations_unique_locale UNIQUE (installation_step_id, locale)
);

CREATE INDEX IF NOT EXISTS installation_step_translations_step_id_idx
  ON public.installation_step_translations (installation_step_id);

-- ============================================
-- Timeline Events
-- ============================================

CREATE TABLE IF NOT EXISTS public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  event_date date NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS timeline_events_sort_order_idx
  ON public.timeline_events (sort_order);

CREATE TABLE IF NOT EXISTS public.timeline_event_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_event_id uuid NOT NULL REFERENCES public.timeline_events(id) ON DELETE CASCADE,
  locale text NOT NULL,
  title text NOT NULL,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT timeline_event_translations_unique_locale UNIQUE (timeline_event_id, locale)
);

CREATE INDEX IF NOT EXISTS timeline_event_translations_event_id_idx
  ON public.timeline_event_translations (timeline_event_id);

-- ============================================
-- Timeline Images (optional)
-- Works with either timeline_events or timeline_items schema
-- ============================================

-- If you use timeline_events
CREATE TABLE IF NOT EXISTS public.timeline_event_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  timeline_event_id uuid NOT NULL REFERENCES public.timeline_events(id) ON DELETE CASCADE,
  media_id integer NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS timeline_event_images_event_id_idx
  ON public.timeline_event_images (timeline_event_id);

-- If you already have timeline_items, create the images table for it too (safe / conditional)
DO $$
BEGIN
  IF to_regclass('public.timeline_items') IS NOT NULL THEN
    EXECUTE $q$
      CREATE TABLE IF NOT EXISTS public.timeline_item_images (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        timeline_item_id uuid NOT NULL REFERENCES public.timeline_items(id) ON DELETE CASCADE,
        media_id integer NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
        sort_order integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    $q$;

    EXECUTE 'CREATE INDEX IF NOT EXISTS timeline_item_images_item_id_idx ON public.timeline_item_images (timeline_item_id)';
  END IF;
END $$;



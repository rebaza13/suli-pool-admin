-- Create Locations tables for Suli Pool Admin
-- Run this in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- Locations (non-translated / shared fields)
-- ============================================

CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT locations_slug_unique UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS locations_sort_order_idx
  ON public.locations (sort_order);

CREATE INDEX IF NOT EXISTS locations_is_enabled_idx
  ON public.locations (is_enabled);

-- ============================================
-- Location Translations (localized fields)
-- ============================================

CREATE TABLE IF NOT EXISTS public.location_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  description text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT location_translations_unique_locale UNIQUE (location_id, locale)
);

CREATE INDEX IF NOT EXISTS location_translations_location_id_idx
  ON public.location_translations (location_id);

CREATE INDEX IF NOT EXISTS location_translations_locale_idx
  ON public.location_translations (locale);



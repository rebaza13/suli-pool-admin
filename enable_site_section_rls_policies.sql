-- Enable RLS policies for Site Section tables
-- Run this in Supabase SQL Editor

-- ============================================
-- Site Section Table
-- ============================================

-- Drop existing policies if they exist (except SELECT which is already there)
DROP POLICY IF EXISTS "Allow authenticated users to insert site_section" ON public.site_section;
DROP POLICY IF EXISTS "Allow authenticated users to update site_section" ON public.site_section;
DROP POLICY IF EXISTS "Allow authenticated users to delete site_section" ON public.site_section;

-- Allow authenticated users to insert site sections
CREATE POLICY "Allow authenticated users to insert site_section"
ON public.site_section
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update site sections
CREATE POLICY "Allow authenticated users to update site_section"
ON public.site_section
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete site sections
CREATE POLICY "Allow authenticated users to delete site_section"
ON public.site_section
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- Section Translations Table
-- ============================================

-- Drop existing policies if they exist (except SELECT which is already there)
DROP POLICY IF EXISTS "Allow authenticated users to insert section_translations" ON public.section_translations;
DROP POLICY IF EXISTS "Allow authenticated users to update section_translations" ON public.section_translations;
DROP POLICY IF EXISTS "Allow authenticated users to delete section_translations" ON public.section_translations;

-- Allow authenticated users to insert translations
CREATE POLICY "Allow authenticated users to insert section_translations"
ON public.section_translations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update translations
CREATE POLICY "Allow authenticated users to update section_translations"
ON public.section_translations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete translations
CREATE POLICY "Allow authenticated users to delete section_translations"
ON public.section_translations
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- Site Section Images Table
-- ============================================

-- Drop existing policies if they exist (except SELECT which is already there)
DROP POLICY IF EXISTS "Allow authenticated users to insert site_section_images" ON public.site_section_images;
DROP POLICY IF EXISTS "Allow authenticated users to update site_section_images" ON public.site_section_images;
DROP POLICY IF EXISTS "Allow authenticated users to delete site_section_images" ON public.site_section_images;

-- Allow authenticated users to insert site section images
CREATE POLICY "Allow authenticated users to insert site_section_images"
ON public.site_section_images
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update site section images
CREATE POLICY "Allow authenticated users to update site_section_images"
ON public.site_section_images
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete site section images
CREATE POLICY "Allow authenticated users to delete site_section_images"
ON public.site_section_images
FOR DELETE
TO authenticated
USING (true);


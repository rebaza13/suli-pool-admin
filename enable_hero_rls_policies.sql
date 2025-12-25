-- Enable RLS policies for hero slides tables
-- Run this in Supabase SQL Editor

-- ============================================
-- Hero Slides Table
-- ============================================

-- Allow authenticated users to read all hero slides
CREATE POLICY "Allow authenticated users to read hero_slides"
ON public.hero_slides
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert hero slides
CREATE POLICY "Allow authenticated users to insert hero_slides"
ON public.hero_slides
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update hero slides
CREATE POLICY "Allow authenticated users to update hero_slides"
ON public.hero_slides
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete hero slides
CREATE POLICY "Allow authenticated users to delete hero_slides"
ON public.hero_slides
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- Hero Slide Translations Table
-- ============================================

-- Allow authenticated users to read translations
CREATE POLICY "Allow authenticated users to read hero_slide_translations"
ON public.hero_slide_translations
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert translations
CREATE POLICY "Allow authenticated users to insert hero_slide_translations"
ON public.hero_slide_translations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update translations
CREATE POLICY "Allow authenticated users to update hero_slide_translations"
ON public.hero_slide_translations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete translations
CREATE POLICY "Allow authenticated users to delete hero_slide_translations"
ON public.hero_slide_translations
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- Hero Slide Images Table
-- ============================================

-- Allow authenticated users to read hero slide images
CREATE POLICY "Allow authenticated users to read hero_slide_images"
ON public.hero_slide_images
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert hero slide images
CREATE POLICY "Allow authenticated users to insert hero_slide_images"
ON public.hero_slide_images
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update hero slide images
CREATE POLICY "Allow authenticated users to update hero_slide_images"
ON public.hero_slide_images
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete hero slide images
CREATE POLICY "Allow authenticated users to delete hero_slide_images"
ON public.hero_slide_images
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- Media Assets Table
-- ============================================

-- Allow authenticated users to read media assets
CREATE POLICY "Allow authenticated users to read media_assets"
ON public.media_assets
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert media assets
CREATE POLICY "Allow authenticated users to insert media_assets"
ON public.media_assets
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update media assets
CREATE POLICY "Allow authenticated users to update media_assets"
ON public.media_assets
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete media assets
CREATE POLICY "Allow authenticated users to delete media_assets"
ON public.media_assets
FOR DELETE
TO authenticated
USING (true);


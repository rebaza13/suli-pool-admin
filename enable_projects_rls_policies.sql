-- Enable RLS policies for Projects tables
-- Requirement: no user_id ownership checks; any authenticated user can CRUD.
-- Run this in Supabase SQL Editor.

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_images ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Projects
-- ============================================

DROP POLICY IF EXISTS "Allow authenticated users to read projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to insert projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to update projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated users to delete projects" ON public.projects;

CREATE POLICY "Allow authenticated users to read projects"
ON public.projects
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete projects"
ON public.projects
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- Project Translations
-- ============================================

DROP POLICY IF EXISTS "Allow authenticated users to read project_translations" ON public.project_translations;
DROP POLICY IF EXISTS "Allow authenticated users to insert project_translations" ON public.project_translations;
DROP POLICY IF EXISTS "Allow authenticated users to update project_translations" ON public.project_translations;
DROP POLICY IF EXISTS "Allow authenticated users to delete project_translations" ON public.project_translations;

CREATE POLICY "Allow authenticated users to read project_translations"
ON public.project_translations
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert project_translations"
ON public.project_translations
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update project_translations"
ON public.project_translations
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete project_translations"
ON public.project_translations
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- Project Images
-- ============================================

DROP POLICY IF EXISTS "Allow authenticated users to read project_images" ON public.project_images;
DROP POLICY IF EXISTS "Allow authenticated users to insert project_images" ON public.project_images;
DROP POLICY IF EXISTS "Allow authenticated users to update project_images" ON public.project_images;
DROP POLICY IF EXISTS "Allow authenticated users to delete project_images" ON public.project_images;

CREATE POLICY "Allow authenticated users to read project_images"
ON public.project_images
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to insert project_images"
ON public.project_images
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update project_images"
ON public.project_images
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete project_images"
ON public.project_images
FOR DELETE
TO authenticated
USING (true);



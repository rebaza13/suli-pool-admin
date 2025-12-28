-- Enable RLS policies for about_company and team_members tables
-- Run this in Supabase SQL Editor

-- ============================================
-- About Company Table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read about_company" ON public.about_company;
DROP POLICY IF EXISTS "Allow authenticated users to insert about_company" ON public.about_company;
DROP POLICY IF EXISTS "Allow authenticated users to update about_company" ON public.about_company;
DROP POLICY IF EXISTS "Allow authenticated users to delete about_company" ON public.about_company;

-- Allow authenticated users to read about_company
CREATE POLICY "Allow authenticated users to read about_company"
ON public.about_company
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert about_company
CREATE POLICY "Allow authenticated users to insert about_company"
ON public.about_company
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update about_company
CREATE POLICY "Allow authenticated users to update about_company"
ON public.about_company
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete about_company
CREATE POLICY "Allow authenticated users to delete about_company"
ON public.about_company
FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- Team Members Table
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authenticated users to insert team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authenticated users to update team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authenticated users to delete team_members" ON public.team_members;

-- Allow authenticated users to read team_members
CREATE POLICY "Allow authenticated users to read team_members"
ON public.team_members
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert team_members
CREATE POLICY "Allow authenticated users to insert team_members"
ON public.team_members
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update team_members
CREATE POLICY "Allow authenticated users to update team_members"
ON public.team_members
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete team_members
CREATE POLICY "Allow authenticated users to delete team_members"
ON public.team_members
FOR DELETE
TO authenticated
USING (true);


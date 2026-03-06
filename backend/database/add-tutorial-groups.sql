-- =============================================
-- MIGRATION: Add Tutorial Group Support
-- Description: Adds tutorial_group columns to profiles and materials tables
-- Date: March 5, 2026
-- =============================================

-- Step 1: Add tutorial_group column to profiles table
-- This allows both students and tutors to be assigned to tutorial groups
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS tutorial_group TEXT;

-- Step 2: Add tutorial_group column to materials table
-- This links materials to specific tutorial groups
ALTER TABLE materials 
ADD COLUMN IF NOT EXISTS tutorial_group TEXT;

-- Step 3: Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_tutorial_group 
ON profiles(tutorial_group);

CREATE INDEX IF NOT EXISTS idx_materials_tutorial_group 
ON materials(tutorial_group);

-- Step 4: Update Row Level Security (RLS) policy for materials
-- Drop the old unrestricted policy
DROP POLICY IF EXISTS "Anyone can view materials" ON materials;

-- Create new policy that restricts students to their tutorial group
CREATE POLICY "Students can view materials from their tutorial group" 
    ON materials FOR SELECT 
    TO authenticated
    USING (
        -- Tutors can see all their own materials
        tutor_id = auth.uid() OR
        -- Students can only see materials from their tutorial group
        (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'student'
                AND profiles.tutorial_group = materials.tutorial_group
            )
        )
    );

-- Step 5: Update the material_stats view to include tutorial_group
DROP VIEW IF EXISTS material_stats;

CREATE OR REPLACE VIEW material_stats AS
SELECT 
    m.id,
    m.title,
    m.course,
    m.tutorial_group,
    m.downloads_count,
    COALESCE(AVG(f.rating), 0) as avg_rating,
    COUNT(f.id) as feedback_count
FROM materials m
LEFT JOIN feedback f ON m.id = f.material_id
GROUP BY m.id, m.title, m.course, m.tutorial_group, m.downloads_count;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Next Steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify the columns were added: SELECT * FROM profiles LIMIT 1;
-- 3. Verify the indexes were created: \d profiles (in psql)
-- 4. Update existing data if needed (see optional steps below)
-- =============================================

-- =============================================
-- OPTIONAL: Update Existing Data
-- =============================================
-- If you have existing tutors who need tutorial groups assigned:
-- UPDATE profiles 
-- SET tutorial_group = 'Group A' 
-- WHERE role = 'tutor' AND email = 'tutor@example.com';

-- If you have existing materials that need tutorial group assignment:
-- UPDATE materials 
-- SET tutorial_group = (
--     SELECT tutorial_group FROM profiles WHERE profiles.id = materials.tutor_id
-- )
-- WHERE tutorial_group IS NULL;

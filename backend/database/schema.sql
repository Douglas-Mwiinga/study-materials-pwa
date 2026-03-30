-- Smart Up Database Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Enable UUID extension (if not already enabled)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- NOTE: In Supabase, enable the "uuid-ossp" extension from the dashboard (Database > Extensions).

-- =============================================
-- 1. USER PROFILES TABLE
-- =============================================
-- Extends Supabase auth.users with additional profile info
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('student', 'tutor')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies: Users can read their own profile
CREATE POLICY "Users can view own profile" 
    ON profiles FOR SELECT 
    USING (auth.uid()::uuid = id);

CREATE POLICY "Users can update own profile" 
    ON profiles FOR UPDATE 
    USING (auth.uid()::uuid = id);

-- =============================================
-- 2. MATERIALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER, -- in bytes
    file_type TEXT, -- PDF, DOCX, etc.
    downloads_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;

-- Materials policies
-- Anyone can read materials
CREATE POLICY "Anyone can view materials" 
    ON materials FOR SELECT 
    TO authenticated
    USING (true);

-- Only tutors can insert materials
CREATE POLICY "Tutors can insert materials" 
    ON materials FOR INSERT 
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'tutor'
        )
    );

-- Tutors can update their own materials
CREATE POLICY "Tutors can update own materials" 
    ON materials FOR UPDATE 
    TO authenticated
    USING (tutor_id = auth.uid());

-- Tutors can delete their own materials
CREATE POLICY "Tutors can delete own materials" 
    ON materials FOR DELETE 
    TO authenticated
    USING (tutor_id = auth.uid());

-- =============================================
-- 3. FEEDBACK TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Feedback policies
-- Students can insert feedback
CREATE POLICY "Students can insert feedback" 
    ON feedback FOR INSERT 
    TO authenticated
    WITH CHECK (
        student_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'student'
        )
    );

-- Students can view their own feedback
CREATE POLICY "Students can view own feedback" 
    ON feedback FOR SELECT 
    TO authenticated
    USING (student_id = auth.uid());

-- Tutors can view feedback on their materials
CREATE POLICY "Tutors can view feedback on their materials" 
    ON feedback FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM materials 
            WHERE materials.id = feedback.material_id 
            AND materials.tutor_id = auth.uid()
        )
    );

-- =============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_materials_tutor ON materials(tutor_id);
CREATE INDEX IF NOT EXISTS idx_materials_course ON materials(course);
CREATE INDEX IF NOT EXISTS idx_feedback_material ON feedback(material_id);
CREATE INDEX IF NOT EXISTS idx_feedback_student ON feedback(student_id);

-- =============================================
-- 5. CREATE FUNCTION TO AUTO-UPDATE updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to materials
CREATE TRIGGER update_materials_updated_at 
    BEFORE UPDATE ON materials 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 6. CREATE VIEW FOR MATERIAL STATS
-- =============================================
CREATE OR REPLACE VIEW material_stats AS
SELECT 
    m.id,
    m.title,
    m.course,
    m.downloads_count,
    COALESCE(AVG(f.rating), 0) as avg_rating,
    COUNT(f.id) as feedback_count
FROM materials m
LEFT JOIN feedback f ON m.id = f.material_id
GROUP BY m.id, m.title, m.course, m.downloads_count;

-- =============================================
-- SUCCESS!
-- =============================================
-- All tables created successfully!
-- Next: Set up Storage bucket for file uploads




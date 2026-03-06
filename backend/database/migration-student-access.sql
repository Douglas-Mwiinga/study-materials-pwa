-- Migration: Add Student Access Management Tables
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. UPDATE PROFILES TABLE - Add name and payment screenshot
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;

-- =============================================
-- 2. CREATE STUDENT APPROVALS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS student_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tutor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    payment_screenshot_url TEXT NOT NULL,
    tutorial_group_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    access_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    notes TEXT -- Optional notes from tutor
);

-- Enable Row Level Security
ALTER TABLE student_approvals ENABLE ROW LEVEL SECURITY;

-- Student approvals policies
-- Students can view their own approval requests
CREATE POLICY "Students can view own approvals" 
    ON student_approvals FOR SELECT 
    TO authenticated
    USING (student_id = auth.uid());

-- Tutors can view approval requests for their account
CREATE POLICY "Tutors can view approval requests" 
    ON student_approvals FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'tutor'
        )
    );

-- Tutors can update approvals (grant/revoke)
CREATE POLICY "Tutors can update approvals" 
    ON student_approvals FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'tutor'
        )
    );

-- =============================================
-- 3. CREATE TUTOR SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tutor_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    default_expiry_day INTEGER NOT NULL DEFAULT 31,
    default_expiry_month INTEGER NOT NULL DEFAULT 12, -- 1-12 for Jan-Dec
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE tutor_settings ENABLE ROW LEVEL SECURITY;

-- Tutor settings policies
-- Tutors can view their own settings
CREATE POLICY "Tutors can view own settings" 
    ON tutor_settings FOR SELECT 
    TO authenticated
    USING (tutor_id = auth.uid());

-- Tutors can update their own settings
CREATE POLICY "Tutors can update own settings" 
    ON tutor_settings FOR UPDATE 
    TO authenticated
    USING (tutor_id = auth.uid());

-- Tutors can insert their own settings
CREATE POLICY "Tutors can insert settings" 
    ON tutor_settings FOR INSERT 
    TO authenticated
    WITH CHECK (tutor_id = auth.uid());

-- =============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_student_approvals_student ON student_approvals(student_id);
CREATE INDEX IF NOT EXISTS idx_student_approvals_tutor ON student_approvals(tutor_id);
CREATE INDEX IF NOT EXISTS idx_student_approvals_status ON student_approvals(status);
CREATE INDEX IF NOT EXISTS idx_tutor_settings_tutor ON tutor_settings(tutor_id);

-- =============================================
-- 5. CREATE TRIGGER FOR tutor_settings updated_at
-- =============================================
CREATE TRIGGER update_tutor_settings_updated_at 
    BEFORE UPDATE ON tutor_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SUCCESS!
-- =============================================
-- Migration complete!

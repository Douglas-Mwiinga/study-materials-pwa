-- Migration: Phase 2 - Admin Dashboard & Tutor Approval System
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. UPDATE PROFILES TABLE - Add admin and tutor status columns
-- =============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutor_status TEXT DEFAULT 'pending' CHECK (tutor_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutor_status_notes TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tutor_approved_at TIMESTAMP WITH TIME ZONE;

-- =============================================
-- 2. CREATE TUTOR APPROVALS TABLE (Admin tracking)
-- =============================================
CREATE TABLE IF NOT EXISTS tutor_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tutor_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE tutor_approvals ENABLE ROW LEVEL SECURITY;

-- Tutor approval policies
-- Admins can view all tutor approvals
CREATE POLICY "Admins can view tutor approvals" 
    ON tutor_approvals FOR SELECT 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Admins can update tutor approvals
CREATE POLICY "Admins can update tutor approvals" 
    ON tutor_approvals FOR UPDATE 
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- =============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_profiles_tutor_status ON profiles(tutor_status) WHERE role = 'tutor';
CREATE INDEX IF NOT EXISTS idx_tutor_approvals_status ON tutor_approvals(status);
CREATE INDEX IF NOT EXISTS idx_tutor_approvals_tutor_id ON tutor_approvals(tutor_id);

-- =============================================
-- SUCCESS!
-- =============================================
-- Phase 2 migration complete!

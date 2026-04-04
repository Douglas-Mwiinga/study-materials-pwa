-- Add 'revoked' to student_approvals status check constraint
-- Run this in your Supabase SQL editor before deploying the unrevoke feature.

ALTER TABLE student_approvals
  DROP CONSTRAINT IF EXISTS student_approvals_status_check;

ALTER TABLE student_approvals
  ADD CONSTRAINT student_approvals_status_check
  CHECK (status IN ('pending', 'approved', 'rejected', 'revoked'));

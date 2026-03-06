-- Storage Bucket Setup for Materials
-- Run this in Supabase SQL Editor after creating tables

-- Create storage bucket for materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for materials bucket
-- Allow authenticated users to read files
CREATE POLICY "Anyone can view material files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'materials');

-- Allow tutors to upload files
CREATE POLICY "Tutors can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'materials' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'tutor'
    )
);

-- Allow tutors to delete their own files
CREATE POLICY "Tutors can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'materials' AND
    owner = auth.uid()
);




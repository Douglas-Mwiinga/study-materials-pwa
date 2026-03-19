-- Migration: Add s3_key column to materials table for S3 downloads
ALTER TABLE materials ADD COLUMN IF NOT EXISTS s3_key TEXT;
-- Add budget_mode column to couples table
-- Supports two modes: 'libre' (free-form, no global total) and 'global' (fixed total with progress tracking)
ALTER TABLE "couples" ADD COLUMN IF NOT EXISTS "budget_mode" text NOT NULL DEFAULT 'libre';

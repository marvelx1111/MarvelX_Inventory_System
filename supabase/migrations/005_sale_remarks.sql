-- Add optional remarks on vehicle sales.

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS remarks TEXT NOT NULL DEFAULT '';

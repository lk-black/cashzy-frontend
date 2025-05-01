/*
  # Update campaigns table structure

  1. Changes
    - Drop end_date column if it exists
    - Update column defaults
    - Add performance indexes

  2. Notes
    - Safely handles column existence checks
    - Adds performance optimizations
*/

-- Drop end_date column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE campaigns DROP COLUMN end_date;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_platform ON campaigns(user_id, platform);

-- Update column defaults
ALTER TABLE campaigns 
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP,
  ALTER COLUMN ad_spend SET DEFAULT 0,
  ALTER COLUMN revenue SET DEFAULT 0,
  ALTER COLUMN creatives_cost SET DEFAULT 0,
  ALTER COLUMN assets_cost SET DEFAULT 0;
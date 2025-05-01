/*
  # Fix expenses table schema

  1. Changes
    - Remove is_recurring column from expenses table
    - Update expenses table structure
    - Add proper foreign key constraints
  
  2. Security
    - Maintain existing RLS policies
*/

-- Drop existing is_recurring column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'expenses' AND column_name = 'is_recurring'
  ) THEN
    ALTER TABLE expenses DROP COLUMN is_recurring;
  END IF;
END $$;

-- Update expenses table structure
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS recurring_id uuid REFERENCES recurring_expenses(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_recurring_id ON expenses(recurring_id);
/*
  # Add transactions table and fix schema issues

  1. Changes
    - Create transactions table
    - Add date columns to campaigns and expenses
    - Fix user_settings duplicates
    - Add recurring_id column to expenses
    - Update indexes
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL,
  description text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policy for transactions
CREATE POLICY "Users can manage own transactions"
  ON transactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add date column to campaigns if it doesn't exist
ALTER TABLE campaigns 
  ADD COLUMN IF NOT EXISTS date date NOT NULL DEFAULT CURRENT_DATE;

-- Add date column to expenses if it doesn't exist
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS date date NOT NULL DEFAULT CURRENT_DATE;

-- Add recurring_id column to expenses if it doesn't exist
ALTER TABLE expenses 
  ADD COLUMN IF NOT EXISTS recurring_id uuid REFERENCES recurring_expenses(id) ON DELETE SET NULL;

-- Fix duplicate user settings by keeping only the latest record for each user
WITH latest_settings AS (
  SELECT DISTINCT ON (user_id) 
    id,
    user_id,
    settings,
    created_at,
    updated_at
  FROM user_settings
  ORDER BY user_id, updated_at DESC
)
DELETE FROM user_settings
WHERE id NOT IN (SELECT id FROM latest_settings);

-- Now we can safely add the unique constraint
ALTER TABLE user_settings 
  ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

-- Update existing indexes
DROP INDEX IF EXISTS idx_campaigns_created_at;
DROP INDEX IF EXISTS idx_expenses_created_at;

CREATE INDEX IF NOT EXISTS idx_campaigns_date ON campaigns(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
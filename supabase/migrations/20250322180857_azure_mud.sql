/*
  # Fix user_settings unique constraint and recurring expenses validation

  1. Changes
    - Drop and recreate user_settings table with proper constraints
    - Add better validation for recurring expenses
    - Add proper indexes
  
  2. Security
    - Maintain RLS policies
    - Add proper constraints
*/

-- Fix user_settings table
DROP TABLE IF EXISTS user_settings CASCADE;
CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_updated_at ON user_settings(updated_at);

-- Fix recurring expenses validation
ALTER TABLE recurring_expenses
  -- Ensure name is properly validated
  DROP CONSTRAINT IF EXISTS recurring_expenses_name_check,
  ADD CONSTRAINT recurring_expenses_name_check 
    CHECK (length(trim(both from name)) > 0),
  
  -- Ensure amount is valid
  DROP CONSTRAINT IF EXISTS recurring_expenses_amount_check,
  ADD CONSTRAINT recurring_expenses_amount_check 
    CHECK (amount > 0),
  
  -- Ensure day_of_month is valid
  DROP CONSTRAINT IF EXISTS recurring_expenses_day_of_month_check,
  ADD CONSTRAINT recurring_expenses_day_of_month_check 
    CHECK (day_of_month >= 1 AND day_of_month <= 31),
  
  -- Ensure type is valid
  DROP CONSTRAINT IF EXISTS recurring_expenses_type_check,
  ADD CONSTRAINT recurring_expenses_type_check 
    CHECK (type IN ('ad', 'creative', 'asset'));

-- Create or replace function to clean recurring expense data
CREATE OR REPLACE FUNCTION clean_recurring_expense_data()
RETURNS trigger AS $$
BEGIN
  -- Clean string fields
  NEW.name = trim(both from NEW.name);
  IF NEW.description IS NOT NULL THEN
    NEW.description = trim(both from NEW.description);
  END IF;
  
  -- Ensure numeric fields are valid
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'amount must be greater than 0';
  END IF;
  
  IF NEW.day_of_month IS NULL OR NEW.day_of_month < 1 OR NEW.day_of_month > 31 THEN
    RAISE EXCEPTION 'day_of_month must be between 1 and 31';
  END IF;
  
  -- Set default values
  NEW.is_active = COALESCE(NEW.is_active, true);
  NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for data cleaning
DROP TRIGGER IF EXISTS clean_recurring_expense_data_trigger ON recurring_expenses;
CREATE TRIGGER clean_recurring_expense_data_trigger
  BEFORE INSERT OR UPDATE ON recurring_expenses
  FOR EACH ROW
  EXECUTE FUNCTION clean_recurring_expense_data();
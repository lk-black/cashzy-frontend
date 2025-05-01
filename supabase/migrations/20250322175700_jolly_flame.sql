/*
  # Fix recurring expenses table structure

  1. Changes
    - Add proper constraints and defaults
    - Fix column names to match frontend
    - Add validation checks
  
  2. Security
    - Maintain existing RLS policies
*/

-- Update recurring_expenses table structure
ALTER TABLE recurring_expenses
  -- Ensure name is not empty
  ADD CONSTRAINT recurring_expenses_name_check 
    CHECK (length(trim(name)) > 0),
  
  -- Ensure amount is positive
  ADD CONSTRAINT recurring_expenses_amount_check 
    CHECK (amount > 0),
  
  -- Ensure day_of_month is valid
  ADD CONSTRAINT recurring_expenses_day_of_month_check 
    CHECK (day_of_month BETWEEN 1 AND 31),
  
  -- Set proper defaults
  ALTER COLUMN is_active SET DEFAULT true,
  ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

-- Create function to trim strings before insert/update
CREATE OR REPLACE FUNCTION trim_recurring_expense_strings()
RETURNS trigger AS $$
BEGIN
  NEW.name = trim(NEW.name);
  IF NEW.description IS NOT NULL THEN
    NEW.description = trim(NEW.description);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to trim strings
DROP TRIGGER IF EXISTS trim_recurring_expense_strings_trigger ON recurring_expenses;
CREATE TRIGGER trim_recurring_expense_strings_trigger
  BEFORE INSERT OR UPDATE ON recurring_expenses
  FOR EACH ROW
  EXECUTE FUNCTION trim_recurring_expense_strings();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_active ON recurring_expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_day_of_month ON recurring_expenses(day_of_month);
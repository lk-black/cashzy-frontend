-- Fix recurring_expenses table validation
ALTER TABLE recurring_expenses
  -- Drop existing constraints
  DROP CONSTRAINT IF EXISTS recurring_expenses_name_check,
  DROP CONSTRAINT IF EXISTS recurring_expenses_amount_check,
  DROP CONSTRAINT IF EXISTS recurring_expenses_day_of_month_check,
  DROP CONSTRAINT IF EXISTS recurring_expenses_type_check;

-- Add improved constraints
ALTER TABLE recurring_expenses
  -- Ensure name is properly validated
  ADD CONSTRAINT recurring_expenses_name_check 
    CHECK (length(trim(both from name)) > 0),
  
  -- Ensure amount is valid
  ADD CONSTRAINT recurring_expenses_amount_check 
    CHECK (amount > 0),
  
  -- Ensure day_of_month is valid
  ADD CONSTRAINT recurring_expenses_day_of_month_check 
    CHECK (day_of_month >= 1 AND day_of_month <= 31),
  
  -- Ensure type is valid
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
  
  -- Validate name
  IF length(NEW.name) = 0 THEN
    RAISE EXCEPTION 'O nome da despesa recorrente é obrigatório';
  END IF;
  
  -- Validate amount
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'O valor deve ser maior que zero';
  END IF;
  
  -- Validate day_of_month
  IF NEW.day_of_month IS NULL OR NEW.day_of_month < 1 OR NEW.day_of_month > 31 THEN
    RAISE EXCEPTION 'O dia deve ser entre 1 e 31';
  END IF;
  
  -- Set default values
  NEW.is_active = COALESCE(NEW.is_active, true);
  NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for data cleaning
DROP TRIGGER IF EXISTS clean_recurring_expense_data_trigger ON recurring_expenses;
CREATE TRIGGER clean_recurring_expense_data_trigger
  BEFORE INSERT OR UPDATE ON recurring_expenses
  FOR EACH ROW
  EXECUTE FUNCTION clean_recurring_expense_data();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_active ON recurring_expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_day_of_month ON recurring_expenses(day_of_month);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_type ON recurring_expenses(type);
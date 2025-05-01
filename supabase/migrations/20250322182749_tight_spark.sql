-- Drop existing triggers and constraints
DROP TRIGGER IF EXISTS clean_recurring_expense_data_trigger ON recurring_expenses;
DROP TRIGGER IF EXISTS trim_recurring_expense_strings_trigger ON recurring_expenses;
DROP FUNCTION IF EXISTS clean_recurring_expense_data CASCADE;
DROP FUNCTION IF EXISTS trim_recurring_expense_strings CASCADE;

-- Create function to validate and clean recurring expense data
CREATE OR REPLACE FUNCTION clean_recurring_expense_data()
RETURNS trigger AS $$
DECLARE
  trimmed_name text;
BEGIN
  -- Get trimmed name
  trimmed_name := trim(both from COALESCE(NEW.name, ''));
  
  -- Validate name
  IF trimmed_name = '' THEN
    RAISE EXCEPTION 'O nome da despesa recorrente é obrigatório';
  END IF;

  -- Clean and validate all fields
  NEW.name = trimmed_name;
  NEW.description = trim(both from COALESCE(NEW.description, ''));
  
  -- Validate amount
  IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
    RAISE EXCEPTION 'O valor deve ser maior que zero';
  END IF;
  
  -- Validate day_of_month
  IF NEW.day_of_month IS NULL OR NEW.day_of_month < 1 OR NEW.day_of_month > 31 THEN
    RAISE EXCEPTION 'O dia deve ser entre 1 e 31';
  END IF;
  
  -- Validate type
  IF NEW.type IS NULL OR NEW.type NOT IN ('ad', 'creative', 'asset') THEN
    RAISE EXCEPTION 'Tipo de despesa inválido';
  END IF;
  
  -- Set default values
  NEW.is_active = COALESCE(NEW.is_active, true);
  NEW.created_at = COALESCE(NEW.created_at, CURRENT_TIMESTAMP);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for data validation and cleaning
CREATE TRIGGER clean_recurring_expense_data_trigger
  BEFORE INSERT OR UPDATE ON recurring_expenses
  FOR EACH ROW
  EXECUTE FUNCTION clean_recurring_expense_data();

-- Drop and recreate constraints
ALTER TABLE recurring_expenses
  DROP CONSTRAINT IF EXISTS recurring_expenses_name_check,
  DROP CONSTRAINT IF EXISTS recurring_expenses_amount_check,
  DROP CONSTRAINT IF EXISTS recurring_expenses_day_of_month_check,
  DROP CONSTRAINT IF EXISTS recurring_expenses_type_check;

ALTER TABLE recurring_expenses
  ADD CONSTRAINT recurring_expenses_name_check 
    CHECK (length(trim(both from name)) > 0),
  ADD CONSTRAINT recurring_expenses_amount_check 
    CHECK (amount > 0),
  ADD CONSTRAINT recurring_expenses_day_of_month_check 
    CHECK (day_of_month BETWEEN 1 AND 31),
  ADD CONSTRAINT recurring_expenses_type_check 
    CHECK (type IN ('ad', 'creative', 'asset'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_user_id ON recurring_expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_is_active ON recurring_expenses(is_active);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_day_of_month ON recurring_expenses(day_of_month);
CREATE INDEX IF NOT EXISTS idx_recurring_expenses_type ON recurring_expenses(type);
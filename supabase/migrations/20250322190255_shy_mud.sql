-- Drop existing policy if it exists
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can manage own data" ON user_data;
EXCEPTION
  WHEN undefined_object THEN
    NULL;
END $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_user_data_trigger ON user_data;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS validate_user_data();

-- Create or replace function to validate user data
CREATE OR REPLACE FUNCTION validate_user_data()
RETURNS trigger AS $$
BEGIN
  -- Ensure data is a valid JSON object
  IF NEW.data IS NULL OR NEW.data = 'null'::jsonb THEN
    NEW.data = '{}'::jsonb;
  END IF;

  -- Validate type
  IF NEW.type NOT IN (
    'achievements', 
    'notifications', 
    'settings', 
    'preferences',
    'pin_security'
  ) THEN
    RAISE EXCEPTION 'Invalid data type: %', NEW.type;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for data validation
CREATE TRIGGER validate_user_data_trigger
  BEFORE INSERT OR UPDATE ON user_data
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_data();

-- Create policy for user data management
CREATE POLICY "Users can manage own data"
  ON user_data
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_type ON user_data(type);
CREATE INDEX IF NOT EXISTS idx_user_data_user_type ON user_data(user_id, type);
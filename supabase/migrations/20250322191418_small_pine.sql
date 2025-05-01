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

  -- Ensure pin_security data has required fields
  IF NEW.type = 'pin_security' THEN
    IF NOT (NEW.data ? 'pin' AND NEW.data ? 'attempts' AND NEW.data ? 'lockoutUntil') THEN
      NEW.data = jsonb_build_object(
        'pin', NEW.data->>'pin',
        'attempts', COALESCE((NEW.data->>'attempts')::int, 0),
        'lockoutUntil', NEW.data->>'lockoutUntil'
      );
    END IF;
  END IF;

  -- Set updated_at
  NEW.updated_at = CURRENT_TIMESTAMP;

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
CREATE INDEX IF NOT EXISTS idx_user_data_updated_at ON user_data(updated_at);

-- Clean up duplicate records before adding unique constraint
DO $$
DECLARE
  r RECORD;
BEGIN
  -- For each user_id and type combination, keep only the latest record
  FOR r IN (
    SELECT DISTINCT ON (user_id, type) 
      id,
      user_id,
      type,
      data,
      created_at,
      updated_at
    FROM user_data
    ORDER BY user_id, type, updated_at DESC
  ) LOOP
    -- Delete all other records for this user_id and type
    DELETE FROM user_data 
    WHERE user_id = r.user_id 
    AND type = r.type 
    AND id != r.id;
  END LOOP;
END $$;

-- Now we can safely add the unique constraint
ALTER TABLE user_data DROP CONSTRAINT IF EXISTS user_data_user_id_type_key;
ALTER TABLE user_data ADD CONSTRAINT user_data_user_id_type_key UNIQUE (user_id, type);

-- Migrate PIN settings using a safer approach
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT 
      user_id,
      settings->'pin_security' as pin_data
    FROM user_settings
    WHERE settings ? 'pin_security'
  ) LOOP
    -- Only insert if no record exists
    INSERT INTO user_data (user_id, type, data)
    SELECT 
      r.user_id,
      'pin_security',
      r.pin_data
    WHERE NOT EXISTS (
      SELECT 1 FROM user_data 
      WHERE user_id = r.user_id 
      AND type = 'pin_security'
    );
  END LOOP;
END $$;
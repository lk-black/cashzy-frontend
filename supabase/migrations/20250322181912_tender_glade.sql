-- Create user_data table for storing various user data types
CREATE TABLE IF NOT EXISTS user_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_type ON user_data(type);
CREATE INDEX IF NOT EXISTS idx_user_data_user_type ON user_data(user_id, type);

-- Enable RLS
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own data"
  ON user_data
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to validate user data
CREATE OR REPLACE FUNCTION validate_user_data()
RETURNS trigger AS $$
BEGIN
  -- Ensure data is a valid JSON object
  IF NEW.data IS NULL OR NEW.data = 'null'::jsonb THEN
    NEW.data = '{}'::jsonb;
  END IF;

  -- Validate type
  IF NEW.type NOT IN ('achievements', 'notifications', 'settings', 'preferences') THEN
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
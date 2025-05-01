-- Drop and recreate user_settings table with better structure
DROP TABLE IF EXISTS user_settings CASCADE;

CREATE TABLE user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT user_settings_user_id_key UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own settings"
  ON user_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON user_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON user_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_user_settings_updated_at ON user_settings(updated_at);

-- Create function to validate settings JSON
CREATE OR REPLACE FUNCTION validate_user_settings()
RETURNS trigger AS $$
BEGIN
  -- Ensure settings is a valid JSON object
  IF NOT (NEW.settings ? 'theme' OR 
          NEW.settings ? 'notifications' OR 
          NEW.settings ? 'preferences') THEN
    NEW.settings = '{}';
  END IF;

  -- Set default values if missing
  IF NOT (NEW.settings ? 'theme') THEN
    NEW.settings = jsonb_set(
      NEW.settings,
      '{theme}',
      '"light"'
    );
  END IF;

  -- Ensure notifications object exists
  IF NOT (NEW.settings ? 'notifications') THEN
    NEW.settings = jsonb_set(
      NEW.settings,
      '{notifications}',
      '{"email": true, "push": true, "budgetAlerts": true}'
    );
  END IF;

  -- Ensure preferences object exists
  IF NOT (NEW.settings ? 'preferences') THEN
    NEW.settings = jsonb_set(
      NEW.settings,
      '{preferences}',
      '{"currency": "BRL", "language": "pt-BR", "dateFormat": "dd/MM/yyyy"}'
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for settings validation
CREATE TRIGGER validate_user_settings_trigger
  BEFORE INSERT OR UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION validate_user_settings();
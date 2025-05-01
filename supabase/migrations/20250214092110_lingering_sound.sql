-- Add missing columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Update existing profiles to have is_active set
UPDATE profiles SET is_active = true WHERE is_active IS NULL;

-- Create indexes for better query performance
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_profiles_is_active'
  ) THEN
    CREATE INDEX idx_profiles_is_active ON profiles(is_active);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_profiles_role'
  ) THEN
    CREATE INDEX idx_profiles_role ON profiles(role);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_profiles_last_sign_in_at'
  ) THEN
    CREATE INDEX idx_profiles_last_sign_in_at ON profiles(last_sign_in_at);
  END IF;
END $$;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admin users can update all profiles" ON profiles;

-- Create new policy for admin updates
CREATE POLICY "Admin users can update all profiles" ON profiles
    FOR UPDATE 
    TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create or replace function to handle user status updates
CREATE OR REPLACE FUNCTION toggle_user_status(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET is_active = NOT is_active
  WHERE id = user_id;
END;
$$;
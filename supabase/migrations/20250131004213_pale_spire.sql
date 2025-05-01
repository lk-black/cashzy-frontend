/*
  # Add user status management
  
  1. New Columns
    - `is_active` (boolean) on profiles table
  
  2. Indexes
    - Index on is_active for better query performance
    - Index on role for better policy performance
    - Index on last_sign_in_at for better date filtering
  
  3. Functions
    - `toggle_user_status` for safely toggling user active state
*/

-- Add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Update existing profiles to have is_active set
UPDATE profiles SET is_active = true WHERE is_active IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in_at ON profiles(last_sign_in_at);

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
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles
  SET is_active = NOT is_active
  WHERE id = user_id;
END;
$$;
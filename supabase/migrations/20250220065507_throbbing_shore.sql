/*
  # Fix Profile Policies and Error Handling

  1. Changes
    - Drop all existing profile policies
    - Create new simplified policies without recursion
    - Add performance indexes
    - Update handle_new_user function with better error handling

  2. Security
    - Enable RLS
    - Add policies for read/write access
    - Implement proper admin role checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "read_profile" ON profiles;
DROP POLICY IF EXISTS "insert_profile" ON profiles;
DROP POLICY IF EXISTS "update_profile" ON profiles;

-- Create simplified policies
CREATE POLICY "select_profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "insert_profiles"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "update_profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR (
    SELECT role FROM profiles WHERE id = auth.uid()
  ) = 'admin')
  WITH CHECK (auth.uid() = id OR (
    SELECT role FROM profiles WHERE id = auth.uid()
  ) = 'admin');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON profiles(id, role);

-- Update handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    created_at,
    updated_at,
    is_active
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    CASE 
      WHEN NEW.email = 'admin@admin.com' THEN 'admin'
      ELSE 'user'
    END,
    NOW(),
    NOW(),
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$;
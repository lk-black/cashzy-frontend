/*
  # Fix profiles policies to prevent infinite recursion

  1. Changes
    - Drop existing policies
    - Create new simplified policies with proper access control
    - Add admin role check using a separate function
  
  2. Security
    - Maintain row level security
    - Ensure proper access control for users and admins
    - Prevent infinite recursion in policy checks
*/

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow service role to manage profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to read all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow admins to update all profiles" ON profiles;

-- Create new simplified policies
CREATE POLICY "profiles_read_policy"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Allow users to read their own profile OR allow admins to read all profiles
    auth.uid() = id OR is_admin()
  );

CREATE POLICY "profiles_insert_policy"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Only allow users to insert their own profile
    auth.uid() = id
  );

CREATE POLICY "profiles_update_policy"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow users to update their own profile OR allow admins to update any profile
    auth.uid() = id OR is_admin()
  )
  WITH CHECK (
    -- Same condition for the check
    auth.uid() = id OR is_admin()
  );

CREATE POLICY "profiles_delete_policy"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (
    -- Only admins can delete profiles
    is_admin()
  );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated;
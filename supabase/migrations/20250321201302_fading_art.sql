/*
  # Fix Profile Policies and Functions

  1. Changes
    - Drop existing policies
    - Create new simplified policies
    - Add admin check function
    - Add performance indexes
    - Update handle_new_user function

  2. Security
    - Enable RLS
    - Add proper access policies
    - Implement safe admin checks
*/

-- Drop existing policies using a safer approach
DO $$
DECLARE
  policy_name text;
BEGIN
  FOR policy_name IN (
    SELECT policyname::text 
    FROM pg_policies 
    WHERE tablename = 'profiles'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON profiles', policy_name);
  END LOOP;
END
$$;

-- Create function to safely check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'admin'
  );
$$;

-- Create new simplified policies
CREATE POLICY "read_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Users can read their own profile
    auth.uid() = id OR
    -- Admins can read all profiles
    is_admin(auth.uid())
  );

CREATE POLICY "insert_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "update_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    -- Users can update their own profile
    auth.uid() = id OR
    -- Admins can update any profile
    is_admin(auth.uid())
  )
  WITH CHECK (
    -- Same conditions for the check
    auth.uid() = id OR
    is_admin(auth.uid())
  );

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
DECLARE
  profile_role text;
BEGIN
  -- Determine role (admin for specific email, user otherwise)
  profile_role := CASE 
    WHEN NEW.email = 'admin@admin.com' THEN 'admin'
    ELSE 'user'
  END;

  -- Insert or update profile with retry logic
  FOR i IN 1..3 LOOP
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
        profile_role,
        NOW(),
        NOW(),
        true
      )
      ON CONFLICT (id) DO UPDATE
      SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, profiles.name),
        updated_at = NOW(),
        role = CASE 
          WHEN profiles.role = 'admin' THEN 'admin'
          ELSE profile_role
        END;

      EXIT; -- Exit loop if successful
    EXCEPTION
      WHEN unique_violation THEN
        -- If it's the last attempt, just update
        IF i = 3 THEN
          UPDATE profiles
          SET
            email = NEW.email,
            name = COALESCE(
              NEW.raw_user_meta_data->>'name',
              split_part(NEW.email, '@', 1),
              profiles.name
            ),
            updated_at = NOW()
          WHERE id = NEW.id;
          EXIT;
        END IF;
        -- Wait a bit and retry
        PERFORM pg_sleep(0.1);
      WHEN others THEN
        RAISE LOG 'Error in handle_new_user (attempt %): %', i, SQLERRM;
        IF i = 3 THEN
          RETURN NEW; -- Return on final attempt
        END IF;
        PERFORM pg_sleep(0.1);
    END;
  END LOOP;

  RETURN NEW;
END;
$$;
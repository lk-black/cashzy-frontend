-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

-- Create function to safely check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = user_id
    AND role = 'admin'
  );
$$;

-- Create new simplified policies
CREATE POLICY "allow_select_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "allow_select_all_profiles_admin"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "allow_insert_own_profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_own_profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "allow_update_all_profiles_admin"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

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
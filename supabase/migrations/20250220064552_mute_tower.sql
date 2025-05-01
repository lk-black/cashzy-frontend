-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

-- Create new simplified policies with better permissions
CREATE POLICY "allow_read_own_profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "allow_read_all_profiles_admin"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

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

CREATE POLICY "allow_admin_update_all_profiles"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Improve handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  default_role text;
BEGIN
  -- Set role based on email
  default_role := CASE 
    WHEN NEW.email = 'admin@admin.com' THEN 'admin'
    ELSE 'user'
  END;

  -- Insert new profile with retry logic
  FOR i IN 1..3 LOOP
    BEGIN
      INSERT INTO public.profiles (
        id,
        email,
        name,
        created_at,
        updated_at,
        is_active,
        role
      ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
          NEW.raw_user_meta_data->>'name',
          split_part(NEW.email, '@', 1)
        ),
        NOW(),
        NOW(),
        true,
        default_role
      )
      ON CONFLICT (id) DO UPDATE
      SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, profiles.name),
        updated_at = NOW(),
        role = CASE 
          WHEN profiles.role = 'admin' THEN 'admin'
          ELSE EXCLUDED.role
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
        ELSE
          -- Wait a bit and retry
          PERFORM pg_sleep(0.1);
          CONTINUE;
        END IF;
      WHEN others THEN
        RAISE LOG 'Error in handle_new_user (attempt %): %', i, SQLERRM;
        IF i = 3 THEN
          RETURN NEW; -- Return on final attempt
        ELSE
          PERFORM pg_sleep(0.1);
          CONTINUE;
        END IF;
    END;
  END LOOP;
    
  RETURN NEW;
END;
$$;
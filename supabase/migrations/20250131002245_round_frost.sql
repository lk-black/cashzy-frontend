/*
  # Add last sign in tracking

  1. Changes
    - Add last_sign_in_at column to profiles table
    - Update trigger to track last sign in time
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add last_sign_in_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'last_sign_in_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_sign_in_at timestamptz;
  END IF;
END $$;

-- Create or replace function to handle auth sign in
CREATE OR REPLACE FUNCTION public.handle_auth_sign_in()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles
  SET last_sign_in_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auth sign ins if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_sign_in'
  ) THEN
    CREATE TRIGGER on_auth_sign_in
      AFTER INSERT ON auth.sessions
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_auth_sign_in();
  END IF;
END $$;
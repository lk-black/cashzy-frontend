/*
  # Add phone and CPF fields to profiles table

  1. Changes
    - Add phone and CPF columns if they don't exist
    - Add constraints if they don't exist
    - Add indexes for better performance
    - Update handle_new_user function
  
  2. Security
    - Maintain existing security settings
*/

-- Add new columns to profiles table
DO $$
BEGIN
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN phone text;
  END IF;

  -- Add cpf column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'cpf'
  ) THEN
    ALTER TABLE profiles ADD COLUMN cpf text;
  END IF;
END $$;

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Add phone check constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'profiles_phone_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_phone_check 
      CHECK (phone ~ '^\+?[1-9]\d{10,14}$');
  END IF;

  -- Add CPF check constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE constraint_name = 'profiles_cpf_check'
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_cpf_check 
      CHECK (cpf ~ '^\d{11}$');
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
  -- Create phone index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_profiles_phone'
  ) THEN
    CREATE INDEX idx_profiles_phone ON profiles(phone);
  END IF;

  -- Create CPF index
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_profiles_cpf'
  ) THEN
    CREATE INDEX idx_profiles_cpf ON profiles(cpf);
  END IF;
END $$;

-- Update handle_new_user function to include new fields
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
    phone,
    cpf,
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
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'cpf',
    'user',
    NOW(),
    NOW(),
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, profiles.name),
    phone = COALESCE(EXCLUDED.phone, profiles.phone),
    cpf = COALESCE(EXCLUDED.cpf, profiles.cpf),
    updated_at = NOW();

  RETURN NEW;
END;
$$;
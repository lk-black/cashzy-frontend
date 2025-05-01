/*
  # Add phone and CPF fields to profiles table

  1. Changes
    - Add phone and cpf columns to profiles table
    - Add validation for phone and CPF formats
    - Update existing triggers
*/

-- Add new columns to profiles table
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS cpf text;

-- Add constraints
ALTER TABLE profiles
  ADD CONSTRAINT profiles_phone_check 
    CHECK (phone ~ '^\+?[1-9]\d{10,14}$'),
  ADD CONSTRAINT profiles_cpf_check 
    CHECK (cpf ~ '^\d{11}$');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON profiles(cpf);

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
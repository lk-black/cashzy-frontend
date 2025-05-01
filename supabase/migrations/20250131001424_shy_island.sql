/*
  # Fix admin user authentication

  1. Changes
    - Drop and recreate admin user with proper password hashing
    - Ensure admin profile exists with correct role
*/

-- Add role column to profiles table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user';
  END IF;
END $$;

-- Create or update admin user
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Delete existing admin user if exists
  DELETE FROM auth.users WHERE email = 'admin@admin.com';
  
  -- Create new admin user with proper password hash
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role,
    created_at,
    updated_at,
    confirmation_token,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    gen_random_uuid(),
    'admin@admin.com',
    crypt('admin', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Admin"}',
    'authenticated',
    'authenticated',
    now(),
    now(),
    '',
    '',
    ''
  )
  RETURNING id INTO admin_user_id;

  -- Create or update admin profile
  INSERT INTO profiles (id, name, email, role)
  VALUES (
    admin_user_id,
    'Admin',
    'admin@admin.com',
    'admin'
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END $$;
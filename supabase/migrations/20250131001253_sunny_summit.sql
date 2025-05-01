/*
  # Add admin user and role

  1. Changes
    - Add role column to profiles table
    - Create admin user with email admin@admin.com
    - Set admin role in profiles table
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

-- Create admin user if it doesn't exist
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Try to find existing admin user
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@admin.com';

  -- If admin user doesn't exist, create it
  IF admin_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change_token_new,
      recovery_token
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@admin.com',
      crypt('admin', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '',
      '',
      ''
    )
    RETURNING id INTO admin_user_id;
  END IF;

  -- Insert or update admin profile
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
/*
  # Fix Admin Authentication System
  
  1. Changes
    - Create admin_users table with proper structure
    - Add necessary indexes and constraints
    - Create password verification function
    - Set up RLS policies
    - Create default admin user
  
  2. Security
    - Enable RLS
    - Add proper policies for access control
*/

-- Drop existing admin_users table and function if they exist
DROP TABLE IF EXISTS admin_users CASCADE;
DROP FUNCTION IF EXISTS verify_admin_password CASCADE;

-- Create admin_users table
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
);

-- Create indexes
CREATE INDEX admin_users_email_idx ON admin_users(email);
CREATE INDEX admin_users_is_active_idx ON admin_users(is_active);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to admin_users"
  ON admin_users
  FOR SELECT
  TO PUBLIC
  USING (true);

CREATE POLICY "Allow authenticated users to update last_login"
  ON admin_users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create password verification function
CREATE OR REPLACE FUNCTION verify_admin_password(
  admin_email text,
  provided_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM admin_users
    WHERE email = admin_email
    AND password_hash = crypt(provided_password, password_hash)
    AND is_active = true
  ) INTO result;
  
  RETURN result;
END
$$;

-- Insert default admin user
INSERT INTO admin_users (email, password_hash, is_active)
VALUES (
  'admin@admin.com',
  crypt('admin123', gen_salt('bf')),
  true
)
ON CONFLICT (email) 
DO UPDATE SET 
  password_hash = crypt('admin123', gen_salt('bf')),
  is_active = true;
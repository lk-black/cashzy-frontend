/*
  # Create separate admin authentication system
  
  1. New Tables
    - `admin_users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamptz)
      - `last_login` (timestamptz)
  
  2. Security
    - Enable RLS on admin_users table
    - Add policy for admin access
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY "Allow full access to admin users"
  ON admin_users
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (
      SELECT id FROM profiles WHERE role = 'admin'
    )
  );

-- Insert default admin user
INSERT INTO admin_users (email, password_hash)
VALUES (
  'admin@admin.com',
  crypt('admin123', gen_salt('bf'))
)
ON CONFLICT (email) DO NOTHING;
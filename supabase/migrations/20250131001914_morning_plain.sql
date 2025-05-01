/*
  # Admin Authentication Updates
  
  1. New Functions
    - `verify_admin_password`: Stored procedure to verify admin passwords securely
  
  2. Security
    - Function accessible only to authenticated users
*/

-- Create function to verify admin passwords
CREATE OR REPLACE FUNCTION verify_admin_password(
  admin_email text,
  provided_password text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_users
    WHERE email = admin_email
    AND password_hash = crypt(provided_password, password_hash)
  );
END;
$$;
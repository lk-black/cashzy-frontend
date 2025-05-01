/*
  # Add receivables system
  
  1. New Tables
    - `receivables`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `amount` (numeric)
      - `due_date` (date)
      - `status` (text)
      - `campaign_id` (uuid, optional, references campaigns)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create receivables table
CREATE TABLE receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  due_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'received', 'overdue')),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  
  -- Ensure name is not empty
  CONSTRAINT receivables_name_check CHECK (length(trim(both from name)) > 0)
);

-- Enable RLS
ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own receivables"
  ON receivables
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_receivables_user_id ON receivables(user_id);
CREATE INDEX idx_receivables_status ON receivables(status);
CREATE INDEX idx_receivables_due_date ON receivables(due_date);
CREATE INDEX idx_receivables_campaign_id ON receivables(campaign_id);
/*
  # Add receivables table if it doesn't exist
  
  1. Changes
    - Safely create table if not exists
    - Add constraints and indexes
    - Enable RLS and add policies
  
  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Create receivables table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'receivables'
  ) THEN
    -- Create table
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
  END IF;
END $$;
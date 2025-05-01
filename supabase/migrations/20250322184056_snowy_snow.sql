-- Drop and recreate budget_limits table with better structure
DROP TABLE IF EXISTS budget_limits CASCADE;

CREATE TABLE budget_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  period text NOT NULL CHECK (period IN ('daily', 'weekly', 'monthly')),
  notify_at integer NOT NULL CHECK (notify_at BETWEEN 1 AND 100),
  active boolean DEFAULT true,
  start_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, category_id, active)
);

-- Enable RLS
ALTER TABLE budget_limits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own budget limits"
  ON budget_limits
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_budget_limits_user_id ON budget_limits(user_id);
CREATE INDEX idx_budget_limits_category_id ON budget_limits(category_id);
CREATE INDEX idx_budget_limits_active ON budget_limits(active);
CREATE INDEX idx_budget_limits_period ON budget_limits(period);
/*
  # Add UTM tracking support
  
  1. New Tables
    - `utm_parameters`
      - `id` (uuid, primary key)
      - `campaign_id` (uuid, references campaigns)
      - `source` (text)
      - `medium` (text)
      - `campaign` (text)
      - `term` (text, optional)
      - `content` (text, optional)
      - `created_at` (timestamptz)

  2. Changes
    - Add UTM-related columns to campaigns table
    
  3. Security
    - Enable RLS on utm_parameters table
    - Add policies for authenticated users
*/

-- Create UTM parameters table
CREATE TABLE IF NOT EXISTS utm_parameters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  source text NOT NULL,
  medium text NOT NULL,
  campaign text NOT NULL,
  term text,
  content text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE utm_parameters ENABLE ROW LEVEL SECURITY;

-- Create policies for UTM parameters
CREATE POLICY "Users can view own UTM parameters"
  ON utm_parameters
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = utm_parameters.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own UTM parameters"
  ON utm_parameters
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = utm_parameters.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own UTM parameters"
  ON utm_parameters
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = utm_parameters.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own UTM parameters"
  ON utm_parameters
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM campaigns
      WHERE campaigns.id = utm_parameters.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_utm_parameters_campaign_id ON utm_parameters(campaign_id);
/*
  # Remove end_date requirement from campaigns table

  1. Changes
    - Make end_date column nullable
    - Add default value for start_date
  
  2. Notes
    - Maintains data integrity by keeping existing end_dates
    - Future entries will have end_date as null
*/

-- Make end_date nullable and set default for start_date
ALTER TABLE campaigns 
  ALTER COLUMN end_date DROP NOT NULL,
  ALTER COLUMN start_date SET DEFAULT CURRENT_DATE;
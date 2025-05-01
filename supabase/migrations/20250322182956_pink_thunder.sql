-- Drop and recreate categories table with better structure
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL,
  icon text NOT NULL,
  type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT categories_name_user_unique UNIQUE (user_id, name),
  CONSTRAINT categories_name_check CHECK (length(trim(both from name)) > 0),
  CONSTRAINT categories_color_check CHECK (color ~* '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$'),
  CONSTRAINT categories_type_check CHECK (type IN ('expense', 'income', 'both'))
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_created_at ON categories(created_at);

-- Create function to clean category data
CREATE OR REPLACE FUNCTION clean_category_data()
RETURNS trigger AS $$
BEGIN
  -- Clean and validate name
  NEW.name = trim(both from NEW.name);
  IF length(NEW.name) = 0 THEN
    RAISE EXCEPTION 'O nome da categoria é obrigatório';
  END IF;

  -- Validate color format
  IF NOT (NEW.color ~* '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$') THEN
    RAISE EXCEPTION 'Formato de cor inválido. Use formato hexadecimal (ex: #FF0000)';
  END IF;

  -- Validate type
  IF NOT (NEW.type = ANY(ARRAY['expense', 'income', 'both'])) THEN
    RAISE EXCEPTION 'Tipo de categoria inválido';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for data cleaning
CREATE TRIGGER clean_category_data_trigger
  BEFORE INSERT OR UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION clean_category_data();
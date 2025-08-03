-- Create digital_products table
CREATE TABLE IF NOT EXISTS digital_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  file_url TEXT NOT NULL,
  preview_url TEXT,
  status TEXT DEFAULT 'draft',
  sales INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create digital_product_purchases table
CREATE TABLE IF NOT EXISTS digital_product_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES digital_products(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  commission DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create RLS policies for digital_products
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products"
  ON digital_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own products"
  ON digital_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON digital_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON digital_products FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for digital_product_purchases
ALTER TABLE digital_product_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own purchases"
  ON digital_product_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create purchases"
  ON digital_product_purchases FOR INSERT
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_digital_products_user_id ON digital_products(user_id);
CREATE INDEX idx_digital_products_type ON digital_products(type);
CREATE INDEX idx_digital_products_status ON digital_products(status);
CREATE INDEX idx_digital_product_purchases_product_id ON digital_product_purchases(product_id);
CREATE INDEX idx_digital_product_purchases_user_id ON digital_product_purchases(user_id);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at column
CREATE TRIGGER update_digital_products_updated_at
  BEFORE UPDATE ON digital_products
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create storage bucket for digital products
INSERT INTO storage.buckets (id, name, public)
VALUES ('digital-products', 'digital-products', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated uploads
CREATE POLICY "Authenticated users can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'digital-products' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policy to allow public downloads
CREATE POLICY "Anyone can download files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'digital-products'); 
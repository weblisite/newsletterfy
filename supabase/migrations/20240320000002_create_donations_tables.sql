-- Create donation_tiers table
CREATE TABLE donation_tiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  perks TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create donations table
CREATE TABLE donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  donation_tier_id UUID REFERENCES donation_tiers(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  user_share DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for donation_tiers
CREATE TRIGGER update_donation_tiers_updated_at
  BEFORE UPDATE ON donation_tiers
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Create function to update user donation stats
CREATE OR REPLACE FUNCTION update_user_donation_stats(user_id UUID, donation_amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    total_donations = COALESCE(total_donations, 0) + donation_amount,
    total_supporters = (
      SELECT COUNT(DISTINCT donor_id)
      FROM donations
      WHERE recipient_id = user_id
    )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX idx_donation_tiers_user_id ON donation_tiers(user_id);
CREATE INDEX idx_donation_tiers_status ON donation_tiers(status);
CREATE INDEX idx_donations_recipient_id ON donations(recipient_id);
CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_created_at ON donations(created_at);

-- Add RLS policies
ALTER TABLE donation_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Policies for donation_tiers
CREATE POLICY "Users can view their own donation tiers"
  ON donation_tiers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own donation tiers"
  ON donation_tiers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own donation tiers"
  ON donation_tiers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own donation tiers"
  ON donation_tiers FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for donations
CREATE POLICY "Users can view donations they've received"
  ON donations FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can view donations they've made"
  ON donations FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Users can create donations"
  ON donations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

-- Add donation stats columns to users table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_donations') THEN
    ALTER TABLE users ADD COLUMN total_donations DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_supporters') THEN
    ALTER TABLE users ADD COLUMN total_supporters INTEGER DEFAULT 0;
  END IF;
END $$; 
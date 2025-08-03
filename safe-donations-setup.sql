-- ================================================
-- SAFE DONATIONS SYSTEM SETUP
-- Checks existing structure and adds missing pieces
-- ================================================

-- First, let's see what we're working with
SELECT 'Current donations table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'donations' 
ORDER BY ordinal_position;

-- Check if donations table exists, if not create it
CREATE TABLE IF NOT EXISTS donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add missing columns to donations table one by one
DO $$ 
BEGIN
  -- Add donor_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'donor_id') THEN
    ALTER TABLE donations ADD COLUMN donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added donor_id column';
  END IF;

  -- Add recipient_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'recipient_id') THEN
    ALTER TABLE donations ADD COLUMN recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    RAISE NOTICE 'Added recipient_id column';
  END IF;

  -- Add donation_tier_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'donation_tier_id') THEN
    ALTER TABLE donations ADD COLUMN donation_tier_id UUID REFERENCES donation_tiers(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added donation_tier_id column';
  END IF;

  -- Add user_share if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'user_share') THEN
    ALTER TABLE donations ADD COLUMN user_share DECIMAL(10,2);
    RAISE NOTICE 'Added user_share column';
  END IF;

  -- Add platform_fee if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'platform_fee') THEN
    ALTER TABLE donations ADD COLUMN platform_fee DECIMAL(10,2);
    RAISE NOTICE 'Added platform_fee column';
  END IF;

  -- Add payment_intent_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'payment_intent_id') THEN
    ALTER TABLE donations ADD COLUMN payment_intent_id TEXT;
    RAISE NOTICE 'Added payment_intent_id column';
  END IF;

  -- Add is_recurring if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'is_recurring') THEN
    ALTER TABLE donations ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Added is_recurring column';
  END IF;

  -- Add recurring_donation_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'recurring_donation_id') THEN
    ALTER TABLE donations ADD COLUMN recurring_donation_id UUID;
    RAISE NOTICE 'Added recurring_donation_id column';
  END IF;

  -- Add goal_id if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'goal_id') THEN
    ALTER TABLE donations ADD COLUMN goal_id UUID;
    RAISE NOTICE 'Added goal_id column';
  END IF;
END $$;

-- Create or check donation_tiers table
CREATE TABLE IF NOT EXISTS donation_tiers (
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

-- Add donation stats to users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_donations') THEN
    ALTER TABLE users ADD COLUMN total_donations DECIMAL(10,2) DEFAULT 0;
    RAISE NOTICE 'Added total_donations to users table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_supporters') THEN
    ALTER TABLE users ADD COLUMN total_supporters INTEGER DEFAULT 0;
    RAISE NOTICE 'Added total_supporters to users table';
  END IF;
END $$;

-- Create recurring_donations table
CREATE TABLE IF NOT EXISTS recurring_donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  donor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  donation_tier_id UUID REFERENCES donation_tiers(id) ON DELETE SET NULL,
  stripe_subscription_id TEXT UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'failed')),
  next_payment_date TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create donation_goals table
CREATE TABLE IF NOT EXISTS donation_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  deadline TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create donation_goal_milestones table
CREATE TABLE IF NOT EXISTS donation_goal_milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES donation_goals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_reached BOOLEAN DEFAULT FALSE,
  reached_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create donation_goal_updates table
CREATE TABLE IF NOT EXISTS donation_goal_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES donation_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create essential indexes
CREATE INDEX IF NOT EXISTS idx_donations_recipient_id ON donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);
CREATE INDEX IF NOT EXISTS idx_donation_tiers_user_id ON donation_tiers(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_donor_id ON recurring_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_recipient_id ON recurring_donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_donation_goals_user_id ON donation_goals(user_id);

-- Enable RLS on all tables
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goal_updates ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for donations
DROP POLICY IF EXISTS "Users can view donations they've received" ON donations;
CREATE POLICY "Users can view donations they've received"
  ON donations FOR SELECT
  USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can view donations they've made" ON donations;
CREATE POLICY "Users can view donations they've made"
  ON donations FOR SELECT
  USING (auth.uid() = donor_id);

DROP POLICY IF EXISTS "Users can create donations" ON donations;
CREATE POLICY "Users can create donations"
  ON donations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

-- Create basic RLS policies for donation_tiers
DROP POLICY IF EXISTS "Users can view their own donation tiers" ON donation_tiers;
CREATE POLICY "Users can view their own donation tiers"
  ON donation_tiers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own donation tiers" ON donation_tiers;
CREATE POLICY "Users can create their own donation tiers"
  ON donation_tiers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own donation tiers" ON donation_tiers;
CREATE POLICY "Users can update their own donation tiers"
  ON donation_tiers FOR UPDATE
  USING (auth.uid() = user_id);

-- Create essential functions
CREATE OR REPLACE FUNCTION update_user_donation_stats(user_id UUID, donation_amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE users
  SET 
    total_donations = COALESCE(total_donations, 0) + donation_amount,
    total_supporters = (
      SELECT COUNT(DISTINCT donor_id)
      FROM donations
      WHERE recipient_id = user_id AND donor_id IS NOT NULL
    )
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_donation_tiers_updated_at ON donation_tiers;
CREATE TRIGGER update_donation_tiers_updated_at
  BEFORE UPDATE ON donation_tiers
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_recurring_donations_updated_at ON recurring_donations;
CREATE TRIGGER update_recurring_donations_updated_at
  BEFORE UPDATE ON recurring_donations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_donation_goals_updated_at ON donation_goals;
CREATE TRIGGER update_donation_goals_updated_at
  BEFORE UPDATE ON donation_goals
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Final check - show the updated donations table structure
SELECT 'Updated donations table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'donations' 
ORDER BY ordinal_position;

-- Success message
SELECT 
  'SUCCESS: Basic Donations System Setup Complete!' as status,
  'The donations table now has all required columns.' as details,
  'Your donation API should now work without errors!' as next_step; 
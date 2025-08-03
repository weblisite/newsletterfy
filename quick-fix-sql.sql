-- QUICK FIX: SYNTAX ERROR + DONATIONS TABLE
-- Fixes the "current_date" parameter syntax error and recipient_id column issue

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing donations table to fix schema
DROP TABLE IF EXISTS donations CASCADE;

-- Donation tiers table (if not exists)
CREATE TABLE IF NOT EXISTS donation_tiers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  perks TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations table with CORRECT schema including recipient_id
CREATE TABLE donations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  donor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  donation_tier_id UUID REFERENCES donation_tiers(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  user_share DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  message TEXT,
  status TEXT DEFAULT 'completed',
  payment_intent_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function with FIXED parameter name (base_date instead of current_date)
CREATE OR REPLACE FUNCTION calculate_next_payment_date(frequency TEXT, base_date TIMESTAMPTZ DEFAULT NOW())
RETURNS TIMESTAMPTZ AS $$
BEGIN
  CASE frequency
    WHEN 'weekly' THEN RETURN base_date + INTERVAL '1 week';
    WHEN 'monthly' THEN RETURN base_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN RETURN base_date + INTERVAL '3 months';
    WHEN 'yearly' THEN RETURN base_date + INTERVAL '1 year';
    ELSE RETURN base_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_donations_recipient_id ON donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);

-- Disable RLS for development
ALTER TABLE donations DISABLE ROW LEVEL SECURITY;
ALTER TABLE donation_tiers DISABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ SYNTAX ERROR FIXED!';
  RAISE NOTICE '✅ DONATIONS TABLE RECREATED WITH recipient_id';
  RAISE NOTICE '🚀 Restart server: npm run dev';
END $$; 
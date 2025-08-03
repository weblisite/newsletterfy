-- Fix Cross-Promotions Schema and Add Missing Tables
-- This migration adds missing fields to cross_promotions table and creates promotion_applications table

-- Add missing fields to cross_promotions table
ALTER TABLE cross_promotions 
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS price_per_subscriber NUMERIC,
ADD COLUMN IF NOT EXISTS daily_budget NUMERIC,
ADD COLUMN IF NOT EXISTS total_budget NUMERIC,
ADD COLUMN IF NOT EXISTS target_niche TEXT,
ADD COLUMN IF NOT EXISTS spent NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscribers_gained INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS newsletter_id UUID,
ADD COLUMN IF NOT EXISTS open_rate NUMERIC DEFAULT 65.5;

-- Update existing records to have proper data structure
UPDATE cross_promotions 
SET 
  title = COALESCE(title, newsletter_name),
  price_per_subscriber = COALESCE(price_per_subscriber, revenue_per_click),
  total_budget = COALESCE(total_budget, 1000),
  daily_budget = COALESCE(daily_budget, 100),
  target_niche = COALESCE(target_niche, 'general'),
  spent = COALESCE(spent, 0),
  subscribers_gained = COALESCE(subscribers_gained, 0)
WHERE title IS NULL OR price_per_subscriber IS NULL;

-- Create promotion_applications table
CREATE TABLE IF NOT EXISTS promotion_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  promotion_id UUID REFERENCES cross_promotions(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  applicant_newsletter_id UUID,
  promotion_owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  applicant_newsletter_name TEXT,
  applicant_subscriber_count INTEGER DEFAULT 0,
  applicant_open_rate NUMERIC DEFAULT 0,
  promotion_newsletter_name TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  UNIQUE(promotion_id, applicant_id)
);

-- Create newsletters table for better association
CREATE TABLE IF NOT EXISTS newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  newsletter_name TEXT NOT NULL,
  description TEXT,
  subscriber_count INTEGER DEFAULT 0,
  open_rate NUMERIC DEFAULT 0,
  click_rate NUMERIC DEFAULT 0,
  niche TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'inactive')),
  website_url TEXT,
  subscription_url TEXT
);

-- Create user_funds table for payment tracking
CREATE TABLE IF NOT EXISTS user_funds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  balance NUMERIC DEFAULT 0,
  pending_balance NUMERIC DEFAULT 0,
  total_earned NUMERIC DEFAULT 0,
  total_spent NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD'
);

-- Create payment_transactions table
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'spend', 'earn')),
  amount NUMERIC NOT NULL,
  description TEXT,
  reference_id UUID, -- Can reference promotion, payout, etc.
  reference_type TEXT, -- 'promotion', 'payout', 'subscription', etc.
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  payment_method TEXT,
  external_transaction_id TEXT
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotion_applications_promotion_id ON promotion_applications(promotion_id);
CREATE INDEX IF NOT EXISTS idx_promotion_applications_applicant_id ON promotion_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_promotion_applications_status ON promotion_applications(status);
CREATE INDEX IF NOT EXISTS idx_newsletters_user_id ON newsletters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_funds_user_id ON user_funds(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_type ON payment_transactions(type);
CREATE INDEX IF NOT EXISTS idx_cross_promotions_newsletter_id ON cross_promotions(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_cross_promotions_target_niche ON cross_promotions(target_niche);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_promotion_applications_updated_at
  BEFORE UPDATE ON promotion_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletters_updated_at
  BEFORE UPDATE ON newsletters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_funds_updated_at
  BEFORE UPDATE ON user_funds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for new tables
ALTER TABLE promotion_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for promotion_applications
CREATE POLICY "promotion_applications_select_policy" ON promotion_applications
  FOR SELECT USING (
    auth.uid() = applicant_id OR 
    auth.uid() = promotion_owner_id OR
    auth.uid() IN (SELECT user_id FROM cross_promotions WHERE id = promotion_id)
  );

CREATE POLICY "promotion_applications_insert_policy" ON promotion_applications
  FOR INSERT WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "promotion_applications_update_policy" ON promotion_applications
  FOR UPDATE USING (
    auth.uid() = promotion_owner_id OR
    auth.uid() IN (SELECT user_id FROM cross_promotions WHERE id = promotion_id)
  );

-- RLS policies for newsletters
CREATE POLICY "newsletters_select_policy" ON newsletters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "newsletters_insert_policy" ON newsletters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "newsletters_update_policy" ON newsletters
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "newsletters_delete_policy" ON newsletters
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_funds
CREATE POLICY "user_funds_select_policy" ON user_funds
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_funds_insert_policy" ON user_funds
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_funds_update_policy" ON user_funds
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS policies for payment_transactions
CREATE POLICY "payment_transactions_select_policy" ON payment_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "payment_transactions_insert_policy" ON payment_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Insert mock data for development
INSERT INTO user_funds (user_id, balance, total_earned, total_spent) 
VALUES ('00000000-0000-0000-0000-000000000001', 5000.00, 2000.00, 1000.00)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO newsletters (id, user_id, newsletter_name, description, subscriber_count, open_rate, niche)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Tech Weekly', 'Weekly tech news and insights', 1250, 68.5, 'tech'),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'Finance Insights', 'Investment and finance tips', 890, 72.3, 'finance')
ON CONFLICT (id) DO NOTHING; 
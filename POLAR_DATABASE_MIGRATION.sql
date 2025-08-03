-- POLAR INTEGRATION DATABASE MIGRATION
-- This migration adds the necessary tables to support Polar.sh payment integration
-- Run this in your Supabase SQL Editor

-- =====================================================
-- PLATFORM SUBSCRIPTIONS (Polar Integration)
-- =====================================================

-- Platform subscriptions table (for Pro, Business, Enterprise plans)
CREATE TABLE IF NOT EXISTS platform_subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_subscription_id TEXT UNIQUE, -- Polar subscription ID
  polar_checkout_id TEXT, -- Polar checkout session ID
  plan_type TEXT NOT NULL CHECK (plan_type IN ('Free', 'Pro', 'Business', 'Enterprise')),
  subscriber_limit INTEGER NOT NULL, -- 1000, 5000, 10000, etc.
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  payment_status TEXT DEFAULT 'active' CHECK (payment_status IN ('active', 'cancelled', 'unpaid', 'incomplete')),
  amount DECIMAL(10, 2) NOT NULL, -- Monthly price in dollars
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  payment_provider TEXT DEFAULT 'polar',
  customer_name TEXT,
  customer_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform orders table (for one-time purchases)
CREATE TABLE IF NOT EXISTS platform_orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_order_id TEXT UNIQUE, -- Polar order ID
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  customer_name TEXT,
  customer_email TEXT,
  payment_provider TEXT DEFAULT 'polar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update the users table to include platform subscription info
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'Free' CHECK (plan_type IN ('Free', 'Pro', 'Business', 'Enterprise')),
ADD COLUMN IF NOT EXISTS subscriber_limit INTEGER DEFAULT 1000,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'past_due'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_user_id ON platform_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_polar_id ON platform_subscriptions(polar_subscription_id);
CREATE INDEX IF NOT EXISTS idx_platform_subscriptions_status ON platform_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_platform_orders_user_id ON platform_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_orders_polar_id ON platform_orders(polar_order_id);
CREATE INDEX IF NOT EXISTS idx_users_plan_type ON users(plan_type);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_platform_subscriptions_updated_at
  BEFORE UPDATE ON platform_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_orders_updated_at
  BEFORE UPDATE ON platform_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for platform subscriptions
ALTER TABLE platform_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own platform subscriptions
CREATE POLICY "Users can view own platform subscriptions" ON platform_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Users can only see their own platform orders
CREATE POLICY "Users can view own platform orders" ON platform_orders
  FOR ALL USING (auth.uid() = user_id);

-- Policy: Service role can access all platform subscriptions (for webhooks)
CREATE POLICY "Service role can access all platform subscriptions" ON platform_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can access all platform orders" ON platform_orders
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default data for existing users (set them to Free plan)
INSERT INTO platform_subscriptions (user_id, plan_type, subscriber_limit, status, amount, currency, payment_provider)
SELECT 
  id as user_id,
  'Free' as plan_type,
  1000 as subscriber_limit,
  'active' as status,
  0 as amount,
  'USD' as currency,
  'direct' as payment_provider
FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM platform_subscriptions WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Update existing users table
UPDATE users 
SET 
  plan_type = 'Free',
  subscriber_limit = 1000,
  subscription_status = 'active'
WHERE plan_type IS NULL OR plan_type = '';
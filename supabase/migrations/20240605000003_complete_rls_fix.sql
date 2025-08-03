-- Complete RLS policy fix for cross-promotions system
-- This ensures all tables work properly with disabled auth mode

-- Temporarily disable RLS to fix policies
ALTER TABLE user_funds DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_applications DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "user_funds_select_policy" ON user_funds;
DROP POLICY IF EXISTS "user_funds_insert_policy" ON user_funds;
DROP POLICY IF EXISTS "user_funds_update_policy" ON user_funds;
DROP POLICY IF EXISTS "payment_transactions_select_policy" ON payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_policy" ON payment_transactions;
DROP POLICY IF EXISTS "newsletters_select_policy" ON newsletters;
DROP POLICY IF EXISTS "newsletters_insert_policy" ON newsletters;
DROP POLICY IF EXISTS "newsletters_update_policy" ON newsletters;
DROP POLICY IF EXISTS "newsletters_delete_policy" ON newsletters;
DROP POLICY IF EXISTS "promotion_applications_select_policy" ON promotion_applications;
DROP POLICY IF EXISTS "promotion_applications_insert_policy" ON promotion_applications;
DROP POLICY IF EXISTS "promotion_applications_update_policy" ON promotion_applications;

-- Re-enable RLS
ALTER TABLE user_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_applications ENABLE ROW LEVEL SECURITY;

-- Create permissive policies that work with development mode
CREATE POLICY "user_funds_allow_all" ON user_funds
  FOR ALL USING (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    current_setting('request.jwt.claims', true)::json->>'sub' IS NULL
  );

CREATE POLICY "payment_transactions_allow_all" ON payment_transactions
  FOR ALL USING (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    current_setting('request.jwt.claims', true)::json->>'sub' IS NULL
  );

CREATE POLICY "newsletters_allow_all" ON newsletters
  FOR ALL USING (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    current_setting('request.jwt.claims', true)::json->>'sub' IS NULL
  );

CREATE POLICY "promotion_applications_allow_all" ON promotion_applications
  FOR ALL USING (
    auth.uid() = applicant_id OR 
    auth.uid() = promotion_owner_id OR
    applicant_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    promotion_owner_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    current_setting('request.jwt.claims', true)::json->>'sub' IS NULL
  );

-- Insert initial user_funds record if it doesn't exist
INSERT INTO user_funds (user_id, balance, total_earned, total_spent)
VALUES ('00000000-0000-0000-0000-000000000001', 5000.00, 2000.00, 1000.00)
ON CONFLICT (user_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  total_earned = EXCLUDED.total_earned,
  total_spent = EXCLUDED.total_spent; 
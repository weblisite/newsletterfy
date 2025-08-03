-- Clean RLS policy fix for cross-promotions system
-- This fixes RLS policies without inserting any mock data

-- Temporarily disable RLS to fix policies
ALTER TABLE user_funds DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters DISABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_applications DISABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "user_funds_select_policy" ON user_funds;
DROP POLICY IF EXISTS "user_funds_insert_policy" ON user_funds;
DROP POLICY IF EXISTS "user_funds_update_policy" ON user_funds;
DROP POLICY IF EXISTS "user_funds_allow_all" ON user_funds;
DROP POLICY IF EXISTS "payment_transactions_select_policy" ON payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_policy" ON payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_allow_all" ON payment_transactions;
DROP POLICY IF EXISTS "newsletters_select_policy" ON newsletters;
DROP POLICY IF EXISTS "newsletters_insert_policy" ON newsletters;
DROP POLICY IF EXISTS "newsletters_update_policy" ON newsletters;
DROP POLICY IF EXISTS "newsletters_delete_policy" ON newsletters;
DROP POLICY IF EXISTS "newsletters_allow_all" ON newsletters;
DROP POLICY IF EXISTS "promotion_applications_select_policy" ON promotion_applications;
DROP POLICY IF EXISTS "promotion_applications_insert_policy" ON promotion_applications;
DROP POLICY IF EXISTS "promotion_applications_update_policy" ON promotion_applications;
DROP POLICY IF EXISTS "promotion_applications_allow_all" ON promotion_applications;

-- Re-enable RLS
ALTER TABLE user_funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_applications ENABLE ROW LEVEL SECURITY;

-- Create very permissive policies for development mode
-- These allow operations when auth is disabled or for mock users

CREATE POLICY "user_funds_dev_policy" ON user_funds
  FOR ALL USING (
    -- Allow if user is authenticated and owns the record
    auth.uid() = user_id OR 
    -- Allow for mock user in development
    user_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    -- Allow when auth is completely disabled (no JWT claims)
    current_setting('request.jwt.claims', true) IS NULL OR
    current_setting('request.jwt.claims', true) = 'null'
  );

CREATE POLICY "payment_transactions_dev_policy" ON payment_transactions
  FOR ALL USING (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    current_setting('request.jwt.claims', true) IS NULL OR
    current_setting('request.jwt.claims', true) = 'null'
  );

CREATE POLICY "newsletters_dev_policy" ON newsletters
  FOR ALL USING (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    current_setting('request.jwt.claims', true) IS NULL OR
    current_setting('request.jwt.claims', true) = 'null'
  );

CREATE POLICY "promotion_applications_dev_policy" ON promotion_applications
  FOR ALL USING (
    auth.uid() = applicant_id OR 
    auth.uid() = promotion_owner_id OR
    applicant_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    promotion_owner_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    current_setting('request.jwt.claims', true) IS NULL OR
    current_setting('request.jwt.claims', true) = 'null'
  );

-- Also update cross_promotions table to be more permissive
DROP POLICY IF EXISTS "cross_promotions_select_policy" ON cross_promotions;
DROP POLICY IF EXISTS "cross_promotions_insert_policy" ON cross_promotions;
DROP POLICY IF EXISTS "cross_promotions_update_policy" ON cross_promotions;
DROP POLICY IF EXISTS "cross_promotions_delete_policy" ON cross_promotions;

CREATE POLICY "cross_promotions_dev_policy" ON cross_promotions
  FOR ALL USING (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid OR
    current_setting('request.jwt.claims', true) IS NULL OR
    current_setting('request.jwt.claims', true) = 'null'
  ); 
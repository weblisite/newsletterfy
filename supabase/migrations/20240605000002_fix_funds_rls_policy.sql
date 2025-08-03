-- Fix RLS policies for development mode with disabled auth
-- This allows the user_funds table to work with mock user IDs

-- Update user_funds RLS policies to work with disabled auth
DROP POLICY IF EXISTS "user_funds_select_policy" ON user_funds;
DROP POLICY IF EXISTS "user_funds_insert_policy" ON user_funds;
DROP POLICY IF EXISTS "user_funds_update_policy" ON user_funds;

-- Create more permissive policies that work with mock users
CREATE POLICY "user_funds_select_policy" ON user_funds
  FOR SELECT USING (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid
  );

CREATE POLICY "user_funds_insert_policy" ON user_funds
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid
  );

CREATE POLICY "user_funds_update_policy" ON user_funds
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid
  );

-- Update payment_transactions RLS policies similarly
DROP POLICY IF EXISTS "payment_transactions_select_policy" ON payment_transactions;
DROP POLICY IF EXISTS "payment_transactions_insert_policy" ON payment_transactions;

CREATE POLICY "payment_transactions_select_policy" ON payment_transactions
  FOR SELECT USING (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid
  );

CREATE POLICY "payment_transactions_insert_policy" ON payment_transactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000001'::uuid
  ); 
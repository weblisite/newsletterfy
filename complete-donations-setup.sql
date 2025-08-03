-- ================================================
-- COMPLETE DONATIONS SYSTEM SETUP
-- Run this entire file in Supabase SQL Editor
-- ================================================

-- 1. Add donation stats columns to users table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_donations') THEN
    ALTER TABLE users ADD COLUMN total_donations DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'total_supporters') THEN
    ALTER TABLE users ADD COLUMN total_supporters INTEGER DEFAULT 0;
  END IF;
END $$;

-- 2. Enhance donations table with missing columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'recipient_id') THEN
    ALTER TABLE donations ADD COLUMN recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'payment_intent_id') THEN
    ALTER TABLE donations ADD COLUMN payment_intent_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'is_recurring') THEN
    ALTER TABLE donations ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'recurring_donation_id') THEN
    ALTER TABLE donations ADD COLUMN recurring_donation_id UUID;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'donations' AND column_name = 'goal_id') THEN
    ALTER TABLE donations ADD COLUMN goal_id UUID;
  END IF;
END $$;

-- 3. Create recurring_donations table
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

-- 4. Create donation_goals table
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

-- 5. Create donation_goal_milestones table
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

-- 6. Create donation_goal_updates table
CREATE TABLE IF NOT EXISTS donation_goal_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES donation_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_donations_recipient_id ON donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_donor_id ON recurring_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_recipient_id ON recurring_donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_status ON recurring_donations(status);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_next_payment ON recurring_donations(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_donation_goals_user_id ON donation_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_goals_status ON donation_goals(status);
CREATE INDEX IF NOT EXISTS idx_donation_goals_deadline ON donation_goals(deadline);
CREATE INDEX IF NOT EXISTS idx_donation_goal_milestones_goal_id ON donation_goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_donation_goal_updates_goal_id ON donation_goal_updates(goal_id);

-- 8. Add foreign key constraints
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_donations_recurring_donation_id') THEN
    ALTER TABLE donations ADD CONSTRAINT fk_donations_recurring_donation_id 
    FOREIGN KEY (recurring_donation_id) REFERENCES recurring_donations(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_donations_goal_id') THEN
    ALTER TABLE donations ADD CONSTRAINT fk_donations_goal_id 
    FOREIGN KEY (goal_id) REFERENCES donation_goals(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 9. Enable RLS on new tables
ALTER TABLE recurring_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goal_updates ENABLE ROW LEVEL SECURITY;

-- 10. Create database functions
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

CREATE OR REPLACE FUNCTION calculate_next_payment_date(frequency TEXT, base_date TIMESTAMP WITH TIME ZONE DEFAULT NOW())
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  CASE frequency
    WHEN 'weekly' THEN
      RETURN base_date + INTERVAL '1 week';
    WHEN 'monthly' THEN
      RETURN base_date + INTERVAL '1 month';
    WHEN 'quarterly' THEN
      RETURN base_date + INTERVAL '3 months';
    WHEN 'yearly' THEN
      RETURN base_date + INTERVAL '1 year';
    ELSE
      RETURN base_date + INTERVAL '1 month';
  END CASE;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.goal_id IS NOT NULL THEN
    UPDATE donation_goals
    SET 
      current_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM donations
        WHERE goal_id = NEW.goal_id AND status = 'completed'
      ),
      status = CASE
        WHEN (
          SELECT COALESCE(SUM(amount), 0)
          FROM donations
          WHERE goal_id = NEW.goal_id AND status = 'completed'
        ) >= target_amount THEN 'completed'
        ELSE status
      END,
      updated_at = timezone('utc'::text, now())
    WHERE id = NEW.goal_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_donation_analytics(creator_id UUID, days_back INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_donations', COALESCE(SUM(amount), 0),
    'total_count', COUNT(*),
    'unique_donors', COUNT(DISTINCT donor_id),
    'average_donation', COALESCE(AVG(amount), 0),
    'recurring_revenue', (
      SELECT COALESCE(SUM(amount), 0)
      FROM recurring_donations
      WHERE recipient_id = creator_id AND status = 'active'
    ),
    'goal_progress', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'title', title,
          'target_amount', target_amount,
          'current_amount', current_amount,
          'progress_percentage', ROUND((current_amount / target_amount * 100)::numeric, 2)
        )
      )
      FROM donation_goals
      WHERE user_id = creator_id AND status = 'active'
    )
  ) INTO result
  FROM donations
  WHERE recipient_id = creator_id 
    AND created_at >= NOW() - (days_back || ' days')::INTERVAL
    AND status = 'completed';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 11. Create triggers
DROP TRIGGER IF EXISTS trigger_update_goal_progress ON donations;
CREATE TRIGGER trigger_update_goal_progress
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW
  EXECUTE PROCEDURE update_goal_progress();

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

-- 12. Create RLS policies for recurring_donations
DROP POLICY IF EXISTS "Users can view their own recurring donations as donors" ON recurring_donations;
CREATE POLICY "Users can view their own recurring donations as donors"
  ON recurring_donations FOR SELECT
  USING (auth.uid() = donor_id);

DROP POLICY IF EXISTS "Users can view recurring donations they receive" ON recurring_donations;
CREATE POLICY "Users can view recurring donations they receive"
  ON recurring_donations FOR SELECT
  USING (auth.uid() = recipient_id);

DROP POLICY IF EXISTS "Users can create recurring donations" ON recurring_donations;
CREATE POLICY "Users can create recurring donations"
  ON recurring_donations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

DROP POLICY IF EXISTS "Users can update their own recurring donations" ON recurring_donations;
CREATE POLICY "Users can update their own recurring donations"
  ON recurring_donations FOR UPDATE
  USING (auth.uid() = donor_id);

-- 13. Create RLS policies for donation_goals
DROP POLICY IF EXISTS "Users can view public donation goals" ON donation_goals;
CREATE POLICY "Users can view public donation goals"
  ON donation_goals FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own donation goals" ON donation_goals;
CREATE POLICY "Users can create their own donation goals"
  ON donation_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own donation goals" ON donation_goals;
CREATE POLICY "Users can update their own donation goals"
  ON donation_goals FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own donation goals" ON donation_goals;
CREATE POLICY "Users can delete their own donation goals"
  ON donation_goals FOR DELETE
  USING (auth.uid() = user_id);

-- 14. Create RLS policies for donation_goal_milestones
DROP POLICY IF EXISTS "Users can view milestones for accessible goals" ON donation_goal_milestones;
CREATE POLICY "Users can view milestones for accessible goals"
  ON donation_goal_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id AND (is_public = true OR user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage milestones for their own goals" ON donation_goal_milestones;
CREATE POLICY "Users can manage milestones for their own goals"
  ON donation_goal_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id AND user_id = auth.uid()
    )
  );

-- 15. Create RLS policies for donation_goal_updates
DROP POLICY IF EXISTS "Users can view updates for accessible goals" ON donation_goal_updates;
CREATE POLICY "Users can view updates for accessible goals"
  ON donation_goal_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id AND (is_public = true OR user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage updates for their own goals" ON donation_goal_updates;
CREATE POLICY "Users can manage updates for their own goals"
  ON donation_goal_updates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id AND user_id = auth.uid()
    )
  );

-- 16. Fix existing donations RLS policies (if needed)
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

-- Success message
SELECT 
  'SUCCESS: Advanced Donations System Setup Complete!' as status,
  'All tables, functions, triggers, and policies have been created.' as details,
  'Your donation system now supports: one-time donations, recurring subscriptions, goal campaigns, milestones, analytics, and more!' as features; 
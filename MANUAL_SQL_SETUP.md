# Manual SQL Setup for Advanced Donations Features

Since the automated migration scripts are having issues with the Supabase CLI, please run these SQL commands manually in your Supabase dashboard SQL editor.

## How to Apply These Commands

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `kgpidjdgayaklvgyzzao`
3. Go to the SQL Editor tab
4. Copy and paste each section below and run them one by one

## Step 1: Add Donation Stats to Users Table

```sql
-- Add donation statistics columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS total_donations DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_supporters INTEGER DEFAULT 0;
```

## Step 2: Enhance Donations Table

```sql
-- Add advanced columns to donations table
ALTER TABLE donations 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurring_donation_id UUID,
ADD COLUMN IF NOT EXISTS goal_id UUID;
```

## Step 3: Create Recurring Donations Table

```sql
-- Create recurring donations table for subscription support
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
```

## Step 4: Create Donation Goals Table

```sql
-- Create donation goals table for campaign support
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
```

## Step 5: Create Goal Milestones Table

```sql
-- Create donation goal milestones table
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
```

## Step 6: Create Goal Updates Table

```sql
-- Create donation goal updates table
CREATE TABLE IF NOT EXISTS donation_goal_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  goal_id UUID REFERENCES donation_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
```

## Step 7: Create Indexes for Performance

```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_donations_donor_id ON recurring_donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_recipient_id ON recurring_donations(recipient_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_status ON recurring_donations(status);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_next_payment ON recurring_donations(next_payment_date);

CREATE INDEX IF NOT EXISTS idx_donation_goals_user_id ON donation_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_goals_status ON donation_goals(status);
CREATE INDEX IF NOT EXISTS idx_donation_goals_deadline ON donation_goals(deadline);

CREATE INDEX IF NOT EXISTS idx_donation_goal_milestones_goal_id ON donation_goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_donation_goal_updates_goal_id ON donation_goal_updates(goal_id);
```

## Step 8: Add Foreign Key Constraints

```sql
-- Add foreign key constraints
ALTER TABLE donations 
ADD CONSTRAINT IF NOT EXISTS fk_donations_recurring_donation_id 
FOREIGN KEY (recurring_donation_id) REFERENCES recurring_donations(id) ON DELETE SET NULL;

ALTER TABLE donations 
ADD CONSTRAINT IF NOT EXISTS fk_donations_goal_id 
FOREIGN KEY (goal_id) REFERENCES donation_goals(id) ON DELETE SET NULL;
```

## Step 9: Enable Row Level Security

```sql
-- Enable RLS on new tables
ALTER TABLE recurring_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goal_updates ENABLE ROW LEVEL SECURITY;
```

## Step 10: Create RLS Policies for Recurring Donations

```sql
-- RLS policies for recurring_donations
CREATE POLICY "Users can view their own recurring donations as donors"
  ON recurring_donations FOR SELECT
  USING (auth.uid() = donor_id);

CREATE POLICY "Users can view recurring donations they receive"
  ON recurring_donations FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can create recurring donations"
  ON recurring_donations FOR INSERT
  WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Users can update their own recurring donations"
  ON recurring_donations FOR UPDATE
  USING (auth.uid() = donor_id);
```

## Step 11: Create RLS Policies for Donation Goals

```sql
-- RLS policies for donation_goals
CREATE POLICY "Users can view public donation goals"
  ON donation_goals FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own donation goals"
  ON donation_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own donation goals"
  ON donation_goals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own donation goals"
  ON donation_goals FOR DELETE
  USING (auth.uid() = user_id);
```

## Step 12: Create RLS Policies for Goal Milestones

```sql
-- RLS policies for donation_goal_milestones
CREATE POLICY "Users can view milestones for accessible goals"
  ON donation_goal_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage milestones for their own goals"
  ON donation_goal_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id AND user_id = auth.uid()
    )
  );
```

## Step 13: Create RLS Policies for Goal Updates

```sql
-- RLS policies for donation_goal_updates
CREATE POLICY "Users can view updates for accessible goals"
  ON donation_goal_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id AND (is_public = true OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage updates for their own goals"
  ON donation_goal_updates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id AND user_id = auth.uid()
    )
  );
```

## Step 14: Create Database Functions

```sql
-- Function to update user donation stats
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
```

```sql
-- Function to calculate next payment date for recurring donations
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
```

```sql
-- Function to update goal progress automatically
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
```

## Step 15: Create Triggers

```sql
-- Trigger to update goal progress when donations are made
CREATE TRIGGER trigger_update_goal_progress
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW
  EXECUTE PROCEDURE update_goal_progress();
```

```sql
-- Trigger to update updated_at timestamp for recurring donations
CREATE TRIGGER update_recurring_donations_updated_at
  BEFORE UPDATE ON recurring_donations
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
```

```sql
-- Trigger to update updated_at timestamp for donation goals
CREATE TRIGGER update_donation_goals_updated_at
  BEFORE UPDATE ON donation_goals
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();
```

## Step 16: Create Analytics Function

```sql
-- Advanced analytics function
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
```

## Verification

After running all the above commands, you can verify the setup by running this query:

```sql
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('donations', 'donation_tiers', 'recurring_donations', 'donation_goals', 'donation_goal_milestones', 'donation_goal_updates')
ORDER BY table_name;
```

## What This Enables

Once all these commands are executed, your Newsletterfy platform will have:

✅ **Core Donations**: One-time donations with custom tiers
✅ **Recurring Subscriptions**: Weekly, monthly, quarterly, yearly subscriptions
✅ **Goal-Driven Campaigns**: Fundraising goals with progress tracking
✅ **Milestone System**: Reward milestones for reaching donation targets
✅ **Campaign Updates**: Keep supporters informed with progress updates
✅ **Advanced Analytics**: Comprehensive donation and revenue analytics
✅ **Stripe Integration**: Real payment processing with webhooks
✅ **Email Notifications**: Automated emails for donors and recipients
✅ **Security Features**: Rate limiting and fraud detection
✅ **Modern Dashboard**: Complete UI for managing all features

The system will be equivalent to platforms like Patreon, Ko-fi, and GoFundMe with enterprise-level features. 
-- Create donation goals/campaigns table
CREATE TABLE IF NOT EXISTS donation_goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  is_featured BOOLEAN DEFAULT FALSE,
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  category TEXT DEFAULT 'general',
  image_url TEXT,
  thankyou_message TEXT,
  progress_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN target_amount > 0 THEN LEAST((current_amount / target_amount) * 100, 100)
      ELSE 0 
    END
  ) STORED,
  donor_count INTEGER DEFAULT 0,
  metadata JSONB
);

-- Add goal tracking to donations
ALTER TABLE donations ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES donation_goals(id) ON DELETE SET NULL;

-- Add goal tracking to recurring donations
ALTER TABLE recurring_donations ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES donation_goals(id) ON DELETE SET NULL;

-- Create donation goal milestones
CREATE TABLE IF NOT EXISTS donation_goal_milestones (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  goal_id UUID REFERENCES donation_goals(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reward_description TEXT,
  is_reached BOOLEAN DEFAULT FALSE,
  reached_at TIMESTAMPTZ,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    (amount / (SELECT target_amount FROM donation_goals WHERE id = goal_id)) * 100
  ) STORED
);

-- Create goal updates/announcements
CREATE TABLE IF NOT EXISTS donation_goal_updates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  goal_id UUID REFERENCES donation_goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  update_type TEXT DEFAULT 'progress' CHECK (update_type IN ('progress', 'milestone', 'announcement', 'completion')),
  is_pinned BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_donation_goals_user_id ON donation_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_donation_goals_status ON donation_goals(status);
CREATE INDEX IF NOT EXISTS idx_donation_goals_end_date ON donation_goals(end_date);
CREATE INDEX IF NOT EXISTS idx_donation_goals_featured ON donation_goals(is_featured);
CREATE INDEX IF NOT EXISTS idx_donations_goal_id ON donations(goal_id);
CREATE INDEX IF NOT EXISTS idx_recurring_donations_goal_id ON recurring_donations(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_milestones_goal_id ON donation_goal_milestones(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_updates_goal_id ON donation_goal_updates(goal_id);

-- Function to update goal progress when donations are made
CREATE OR REPLACE FUNCTION update_goal_progress()
RETURNS TRIGGER AS $$
DECLARE
  v_goal_id UUID;
  v_new_amount DECIMAL(10,2);
  v_donor_count INTEGER;
  v_target_amount DECIMAL(10,2);
  v_milestone RECORD;
BEGIN
  -- Get goal_id from the donation
  v_goal_id := COALESCE(NEW.goal_id, OLD.goal_id);
  
  IF v_goal_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Calculate new total amount for the goal
  SELECT 
    COALESCE(SUM(amount), 0),
    COUNT(DISTINCT COALESCE(donor_id, donor_email)),
    MAX(target_amount)
  INTO v_new_amount, v_donor_count, v_target_amount
  FROM donations d
  JOIN donation_goals g ON d.goal_id = g.id
  WHERE d.goal_id = v_goal_id 
    AND d.status = 'completed'
    AND g.id = v_goal_id;
  
  -- Update goal progress
  UPDATE donation_goals 
  SET 
    current_amount = v_new_amount,
    donor_count = v_donor_count,
    updated_at = NOW(),
    status = CASE 
      WHEN v_new_amount >= target_amount AND status = 'active' THEN 'completed'
      ELSE status 
    END
  WHERE id = v_goal_id;
  
  -- Check and mark reached milestones
  FOR v_milestone IN 
    SELECT * FROM donation_goal_milestones 
    WHERE goal_id = v_goal_id 
      AND amount <= v_new_amount 
      AND is_reached = FALSE
    ORDER BY amount
  LOOP
    UPDATE donation_goal_milestones 
    SET 
      is_reached = TRUE,
      reached_at = NOW()
    WHERE id = v_milestone.id;
    
    -- Create milestone update
    INSERT INTO donation_goal_updates (goal_id, title, content, update_type)
    VALUES (
      v_goal_id,
      'Milestone Reached: ' || v_milestone.title,
      'We''ve reached the ' || v_milestone.title || ' milestone! ' || COALESCE(v_milestone.description, ''),
      'milestone'
    );
  END LOOP;
  
  -- Create completion update if goal is reached
  IF v_new_amount >= v_target_amount THEN
    INSERT INTO donation_goal_updates (goal_id, title, content, update_type)
    VALUES (
      v_goal_id,
      '🎉 Goal Completed!',
      'Amazing! We''ve reached our goal of $' || v_target_amount || '. Thank you to all ' || v_donor_count || ' supporters!',
      'completion'
    )
    ON CONFLICT DO NOTHING; -- Prevent duplicate completion updates
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update goal progress
CREATE TRIGGER update_goal_progress_on_donation_insert
  AFTER INSERT ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

CREATE TRIGGER update_goal_progress_on_donation_update
  AFTER UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION update_goal_progress();

-- Function to get goal analytics
CREATE OR REPLACE FUNCTION get_goal_analytics(p_goal_id UUID)
RETURNS TABLE (
  total_donations INTEGER,
  unique_donors INTEGER,
  average_donation DECIMAL,
  largest_donation DECIMAL,
  recent_donors JSONB,
  daily_progress JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(d.id)::INTEGER as total_donations,
    COUNT(DISTINCT COALESCE(d.donor_id, d.metadata->>'donor_email'))::INTEGER as unique_donors,
    COALESCE(AVG(d.amount), 0) as average_donation,
    COALESCE(MAX(d.amount), 0) as largest_donation,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'amount', d.amount,
          'donor_name', COALESCE(
            (SELECT name FROM users WHERE id = d.donor_id),
            (d.metadata->>'donor_name')::text,
            'Anonymous'
          ),
          'message', d.message,
          'created_at', d.created_at
        ) ORDER BY d.created_at DESC
      ) FILTER (WHERE d.id IS NOT NULL), 
      '[]'::jsonb
    ) as recent_donors,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'date', date_trunc('day', d.created_at),
          'amount', SUM(d.amount),
          'count', COUNT(d.id)
        ) ORDER BY date_trunc('day', d.created_at)
      ) FILTER (WHERE d.id IS NOT NULL),
      '[]'::jsonb
    ) as daily_progress
  FROM donations d
  WHERE d.goal_id = p_goal_id 
    AND d.status = 'completed'
  GROUP BY d.goal_id;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies
ALTER TABLE donation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goal_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goal_updates ENABLE ROW LEVEL SECURITY;

-- Goals policies
CREATE POLICY "Users can view public goals"
  ON donation_goals FOR SELECT
  USING (visibility = 'public' OR user_id = auth.uid());

CREATE POLICY "Users can manage their own goals"
  ON donation_goals FOR ALL
  USING (auth.uid() = user_id);

-- Milestones policies  
CREATE POLICY "Users can view milestones for visible goals"
  ON donation_goal_milestones FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id 
        AND (visibility = 'public' OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage milestones for their goals"
  ON donation_goal_milestones FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id AND user_id = auth.uid()
    )
  );

-- Updates policies
CREATE POLICY "Users can view updates for visible goals"
  ON donation_goal_updates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id 
        AND (visibility = 'public' OR user_id = auth.uid())
    )
  );

CREATE POLICY "Users can manage updates for their goals"
  ON donation_goal_updates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM donation_goals 
      WHERE id = goal_id AND user_id = auth.uid()
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_donation_goals_updated_at
  BEFORE UPDATE ON donation_goals
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column(); 
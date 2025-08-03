-- Create mock user and initial funds for development mode
-- This solves foreign key constraint issues

-- Insert mock user into auth.users table if it doesn't exist
INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'authenticated',
  'authenticated',
  'dev@newsletterfy.com',
  '$2a$10$mockHashForDevelopmentOnly',
  NOW(),
  NULL,
  '',
  NULL,
  '',
  NULL,
  '',
  '',
  NULL,
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Development User"}',
  false,
  NOW(),
  NOW(),
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Insert initial user_funds record for the mock user
INSERT INTO user_funds (user_id, balance, total_earned, total_spent)
VALUES ('00000000-0000-0000-0000-000000000001', 5000.00, 2000.00, 1000.00)
ON CONFLICT (user_id) DO UPDATE SET
  balance = EXCLUDED.balance,
  total_earned = EXCLUDED.total_earned,
  total_spent = EXCLUDED.total_spent;

-- Insert a sample newsletter for testing
INSERT INTO newsletters (id, user_id, name, description, subject_line, sender_email, reply_to_email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000001',
  'Tech Weekly',
  'A weekly newsletter about technology trends and innovations',
  'This Week in Tech',
  'techweekly@mail.newsletterfy.com',
  'dev@newsletterfy.com',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING; 
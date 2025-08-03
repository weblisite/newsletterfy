-- Sponsored Ads System Database Schema
-- This migration creates all necessary tables for a complete sponsored ads system

-- Enable the necessary extensions
create extension if not exists "uuid-ossp";

-- =====================================================
-- BRAND MANAGEMENT SYSTEM
-- =====================================================

-- Brands table for brand accounts and profiles
create table if not exists brands (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null, -- Brand account owner
  brand_name text not null,
  company_name text not null,
  website text,
  industry text not null,
  description text,
  logo_url text,
  contact_email text not null,
  contact_phone text,
  verified boolean default false,
  status text default 'active' check (status in ('active', 'suspended', 'pending')),
  billing_info jsonb, -- Stripe customer info, payment methods
  total_spent numeric default 0,
  total_campaigns integer default 0,
  average_ctr numeric default 0
);

-- Brand funds/balance management
create table if not exists brand_funds (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid references brands on delete cascade not null,
  balance numeric default 0,
  total_deposited numeric default 0,
  total_spent numeric default 0,
  last_deposit_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enhanced sponsored ads table
create table if not exists sponsored_ad_campaigns (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  brand_id uuid references brands on delete cascade not null,
  publisher_id uuid references auth.users on delete cascade, -- Newsletter owner (when approved)
  
  -- Campaign Details
  campaign_name text not null,
  campaign_type text default 'newsletter_placement' check (campaign_type in ('newsletter_placement', 'sponsored_content', 'banner_ad')),
  
  -- Creative Content
  ad_title text not null,
  ad_description text not null,
  call_to_action text not null,
  landing_url text not null,
  creative_urls text[], -- Array of image/video URLs
  
  -- Budget & Pricing
  budget_total numeric not null,
  budget_daily numeric,
  bid_type text default 'cpm' check (bid_type in ('cpm', 'cpc', 'cpa')), -- Cost per mille, click, action
  bid_amount numeric not null,
  
  -- Targeting
  target_demographics jsonb, -- Age, gender, location
  target_interests text[], -- Interest categories
  target_newsletters text[], -- Specific newsletter targeting
  target_niches text[], -- Industry/niche targeting
  
  -- Campaign Status & Scheduling
  status text default 'pending' check (status in ('draft', 'pending', 'approved', 'active', 'paused', 'completed', 'rejected')),
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  
  -- Performance Metrics
  impressions integer default 0,
  clicks integer default 0,
  conversions integer default 0,
  spent numeric default 0,
  revenue_generated numeric default 0, -- For publisher
  
  -- Approval Workflow
  approval_status text default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  approval_notes text,
  approved_by uuid references auth.users,
  approved_at timestamp with time zone,
  
  -- Additional Settings
  frequency_cap integer default 3, -- Max times shown to same user
  priority_level integer default 1 check (priority_level between 1 and 10)
);

-- Ad creatives management (separate table for multiple creatives per campaign)
create table if not exists ad_creatives (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references sponsored_ad_campaigns on delete cascade not null,
  creative_type text not null check (creative_type in ('image', 'video', 'gif', 'text')),
  creative_url text,
  creative_text text,
  alt_text text,
  file_size integer,
  dimensions text, -- e.g., "1200x630"
  is_primary boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- AD PLACEMENT SYSTEM
-- =====================================================

-- Newsletter ad placements
create table if not exists newsletter_ad_placements (
  id uuid primary key default uuid_generate_v4(),
  newsletter_id uuid not null, -- References newsletters table
  campaign_id uuid references sponsored_ad_campaigns on delete cascade not null,
  placement_position text not null check (placement_position in ('header', 'top', 'middle', 'bottom', 'footer', 'sidebar')),
  placement_order integer default 1,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ad performance tracking per placement
create table if not exists ad_placement_analytics (
  id uuid primary key default uuid_generate_v4(),
  placement_id uuid references newsletter_ad_placements on delete cascade not null,
  campaign_id uuid references sponsored_ad_campaigns on delete cascade not null,
  newsletter_send_id uuid, -- References newsletter sends
  
  -- Performance Metrics
  impressions integer default 0,
  clicks integer default 0,
  unique_clicks integer default 0,
  conversions integer default 0,
  click_through_rate numeric default 0,
  conversion_rate numeric default 0,
  
  -- Financial Metrics
  cost numeric default 0,
  revenue numeric default 0, -- Revenue for publisher
  
  -- Tracking
  tracking_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- CAMPAIGN APPROVAL WORKFLOW
-- =====================================================

-- Campaign approval requests
create table if not exists campaign_approval_requests (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references sponsored_ad_campaigns on delete cascade not null,
  publisher_id uuid references auth.users on delete cascade not null, -- Newsletter owner
  brand_id uuid references brands on delete cascade not null,
  
  -- Request Details
  requested_placement_positions text[], -- Preferred positions
  proposed_rate numeric, -- Publisher's proposed rate
  message text, -- Message from brand to publisher
  
  -- Response
  status text default 'pending' check (status in ('pending', 'approved', 'rejected', 'counter_offered')),
  response_message text,
  final_rate numeric, -- Agreed rate
  
  -- Timestamps
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  responded_at timestamp with time zone,
  expires_at timestamp with time zone default (now() + interval '7 days')
);

-- =====================================================
-- FINANCIAL TRANSACTIONS
-- =====================================================

-- Brand payment transactions
create table if not exists brand_transactions (
  id uuid primary key default uuid_generate_v4(),
  brand_id uuid references brands on delete cascade not null,
  campaign_id uuid references sponsored_ad_campaigns on delete cascade,
  
  -- Transaction Details
  transaction_type text not null check (transaction_type in ('deposit', 'campaign_spend', 'refund', 'fee')),
  amount numeric not null,
  currency text default 'USD',
  description text not null,
  
  -- Payment Processing
  stripe_payment_intent_id text,
  status text default 'pending' check (status in ('pending', 'completed', 'failed', 'refunded')),
  
  -- Timestamps
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

-- Publisher earnings from ads
create table if not exists publisher_ad_earnings (
  id uuid primary key default uuid_generate_v4(),
  publisher_id uuid references auth.users on delete cascade not null,
  campaign_id uuid references sponsored_ad_campaigns on delete cascade not null,
  brand_id uuid references brands on delete cascade not null,
  
  -- Earnings Details
  gross_amount numeric not null, -- Total earned
  platform_fee_rate numeric default 0.20, -- 20% platform fee
  platform_fee_amount numeric not null,
  net_amount numeric not null, -- Amount after platform fee
  
  -- Performance Context
  impressions integer not null,
  clicks integer not null,
  conversions integer default 0,
  
  -- Status
  status text default 'pending' check (status in ('pending', 'confirmed', 'paid')),
  payout_date timestamp with time zone,
  
  -- Timestamps
  earning_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- TARGETING & AUDIENCE MANAGEMENT
-- =====================================================

-- Newsletter categories for targeting
create table if not exists newsletter_categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  slug text not null unique,
  description text,
  parent_id uuid references newsletter_categories,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Newsletter audience insights for targeting
create table if not exists newsletter_audience_insights (
  id uuid primary key default uuid_generate_v4(),
  newsletter_id uuid not null, -- References newsletters table
  publisher_id uuid references auth.users on delete cascade not null,
  
  -- Audience Demographics
  subscriber_count integer not null,
  avg_open_rate numeric,
  avg_click_rate numeric,
  engagement_score numeric, -- Calculated engagement score
  
  -- Audience Composition
  age_distribution jsonb, -- {"18-25": 20, "26-35": 40, ...}
  gender_distribution jsonb,
  location_distribution jsonb,
  interest_tags text[],
  
  -- Performance Metrics
  last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Brand indexes
create index if not exists brands_user_id_idx on brands(user_id);
create index if not exists brands_status_idx on brands(status);
create index if not exists brands_industry_idx on brands(industry);

-- Campaign indexes
create index if not exists sponsored_ad_campaigns_brand_id_idx on sponsored_ad_campaigns(brand_id);
create index if not exists sponsored_ad_campaigns_publisher_id_idx on sponsored_ad_campaigns(publisher_id);
create index if not exists sponsored_ad_campaigns_status_idx on sponsored_ad_campaigns(status);
create index if not exists sponsored_ad_campaigns_approval_status_idx on sponsored_ad_campaigns(approval_status);
create index if not exists sponsored_ad_campaigns_start_date_idx on sponsored_ad_campaigns(start_date);
create index if not exists sponsored_ad_campaigns_target_niches_idx on sponsored_ad_campaigns using gin(target_niches);

-- Performance indexes
create index if not exists ad_placement_analytics_campaign_id_idx on ad_placement_analytics(campaign_id);
create index if not exists ad_placement_analytics_tracking_date_idx on ad_placement_analytics(tracking_date);

-- Financial indexes
create index if not exists brand_transactions_brand_id_idx on brand_transactions(brand_id);
create index if not exists brand_transactions_campaign_id_idx on brand_transactions(campaign_id);
create index if not exists publisher_ad_earnings_publisher_id_idx on publisher_ad_earnings(publisher_id);
create index if not exists publisher_ad_earnings_campaign_id_idx on publisher_ad_earnings(campaign_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_brands_updated_at
  before update on brands
  for each row
  execute function update_updated_at_column();

create trigger update_brand_funds_updated_at
  before update on brand_funds
  for each row
  execute function update_updated_at_column();

create trigger update_sponsored_ad_campaigns_updated_at
  before update on sponsored_ad_campaigns
  for each row
  execute function update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
alter table brands enable row level security;
alter table brand_funds enable row level security;
alter table sponsored_ad_campaigns enable row level security;
alter table ad_creatives enable row level security;
alter table newsletter_ad_placements enable row level security;
alter table ad_placement_analytics enable row level security;
alter table campaign_approval_requests enable row level security;
alter table brand_transactions enable row level security;
alter table publisher_ad_earnings enable row level security;
alter table newsletter_categories enable row level security;
alter table newsletter_audience_insights enable row level security;

-- Brand policies
create policy "Brands can view own data" on brands for all using (user_id = auth.uid());
create policy "Brands can view own funds" on brand_funds for all using (brand_id in (select id from brands where user_id = auth.uid()));

-- Campaign policies
create policy "Brands can manage own campaigns" on sponsored_ad_campaigns for all using (brand_id in (select id from brands where user_id = auth.uid()));
create policy "Publishers can view campaigns targeting them" on sponsored_ad_campaigns for select using (publisher_id = auth.uid() or status = 'approved');

-- Earnings policies
create policy "Publishers can view own earnings" on publisher_ad_earnings for all using (publisher_id = auth.uid());

-- Newsletter categories are public
create policy "Newsletter categories are publicly readable" on newsletter_categories for select using (true);

-- =====================================================
-- DEFAULT DATA
-- =====================================================

-- Insert default newsletter categories
insert into newsletter_categories (name, slug, description) values
('Technology', 'technology', 'Tech news, software, and innovation'),
('Business', 'business', 'Business news, entrepreneurship, and finance'),
('Health & Fitness', 'health-fitness', 'Health tips, fitness, and wellness'),
('Lifestyle', 'lifestyle', 'Lifestyle, fashion, and personal development'),
('Education', 'education', 'Learning, courses, and educational content'),
('Marketing', 'marketing', 'Digital marketing, SEO, and advertising'),
('Finance', 'finance', 'Personal finance, investing, and economics'),
('Food & Cooking', 'food-cooking', 'Recipes, cooking tips, and food culture'),
('Travel', 'travel', 'Travel guides, tips, and experiences'),
('Entertainment', 'entertainment', 'Movies, music, and entertainment news')
on conflict (slug) do nothing; 
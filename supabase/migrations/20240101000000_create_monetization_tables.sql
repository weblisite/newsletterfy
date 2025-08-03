-- Enable the necessary extensions
create extension if not exists "uuid-ossp";

-- Create tables with proper naming convention (snake_case)
create table if not exists sponsored_ads (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null,
  brand_name text not null,
  campaign text not null,
  budget numeric not null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  status text not null,
  clicks integer default 0,
  impressions integer default 0,
  revenue numeric default 0
);

create table if not exists cross_promotions (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null,
  newsletter_name text not null,
  description text not null,
  subscribers integer not null,
  revenue_per_click numeric not null,
  clicks integer default 0,
  revenue numeric default 0,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  status text not null
);

create table if not exists subscription_tiers (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  price numeric not null,
  interval text not null,
  features text[] not null,
  status text not null,
  subscribers integer default 0,
  revenue numeric default 0
);

create table if not exists donation_tiers (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  amount numeric not null,
  description text not null,
  perks text[] not null,
  active boolean default true
);

create table if not exists donations (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null,
  supporter text not null,
  amount numeric not null,
  message text,
  type text not null,
  tier_id uuid references donation_tiers on delete set null
);

create table if not exists digital_products (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null,
  price numeric not null,
  description text not null,
  features text[] not null,
  status text not null,
  sales integer default 0,
  revenue numeric default 0
);

create table if not exists affiliate_links (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  code text unique not null,
  url text not null,
  clicks integer default 0,
  conversions integer default 0,
  revenue numeric default 0
);

create table if not exists affiliate_referrals (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references auth.users on delete cascade not null,
  referred_user text not null,
  plan text not null,
  amount numeric not null,
  commission numeric not null,
  status text not null,
  link_id uuid references affiliate_links on delete cascade not null
);

create table if not exists monetization_stats (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade unique not null,
  sponsored_ads_average_earnings numeric default 0,
  sponsored_ads_active_sponsors integer default 0,
  sponsored_ads_platform_fee integer default 20,
  cross_promotions_clicks integer default 0,
  cross_promotions_revenue numeric default 0,
  cross_promotions_platform_fee integer default 20,
  paid_subscriptions_subscribers integer default 0,
  paid_subscriptions_revenue numeric default 0,
  paid_subscriptions_platform_fee integer default 10,
  tips_and_donations_supporters integer default 0,
  tips_and_donations_total numeric default 0,
  tips_and_donations_platform_fee integer default 10,
  digital_products_sold integer default 0,
  digital_products_revenue numeric default 0,
  digital_products_platform_fee integer default 10,
  affiliate_program_referrals integer default 0,
  affiliate_program_commission numeric default 0,
  affiliate_program_platform_fee integer default 50
);

-- Create indexes for better query performance
create index if not exists sponsored_ads_user_id_idx on sponsored_ads(user_id);
create index if not exists cross_promotions_user_id_idx on cross_promotions(user_id);
create index if not exists subscription_tiers_user_id_idx on subscription_tiers(user_id);
create index if not exists donations_user_id_idx on donations(user_id);
create index if not exists donation_tiers_user_id_idx on donation_tiers(user_id);
create index if not exists digital_products_user_id_idx on digital_products(user_id);
create index if not exists affiliate_links_user_id_idx on affiliate_links(user_id);
create index if not exists affiliate_referrals_user_id_idx on affiliate_referrals(user_id);

-- Create updated_at triggers
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_sponsored_ads_updated_at
  before update on sponsored_ads
  for each row
  execute function update_updated_at_column();

create trigger update_cross_promotions_updated_at
  before update on cross_promotions
  for each row
  execute function update_updated_at_column();

create trigger update_subscription_tiers_updated_at
  before update on subscription_tiers
  for each row
  execute function update_updated_at_column();

create trigger update_donations_updated_at
  before update on donations
  for each row
  execute function update_updated_at_column();

create trigger update_donation_tiers_updated_at
  before update on donation_tiers
  for each row
  execute function update_updated_at_column();

create trigger update_digital_products_updated_at
  before update on digital_products
  for each row
  execute function update_updated_at_column();

create trigger update_affiliate_links_updated_at
  before update on affiliate_links
  for each row
  execute function update_updated_at_column();

create trigger update_affiliate_referrals_updated_at
  before update on affiliate_referrals
  for each row
  execute function update_updated_at_column(); 
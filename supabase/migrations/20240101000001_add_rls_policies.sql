-- Enable Row Level Security for all tables
alter table sponsored_ads enable row level security;
alter table cross_promotions enable row level security;
alter table subscription_tiers enable row level security;
alter table donations enable row level security;
alter table donation_tiers enable row level security;
alter table digital_products enable row level security;
alter table affiliate_links enable row level security;
alter table affiliate_referrals enable row level security;
alter table monetization_stats enable row level security;

-- Create policies for sponsored_ads
create policy "Users can view their own sponsored ads"
  on sponsored_ads for select
  using (auth.uid() = user_id);

create policy "Users can create their own sponsored ads"
  on sponsored_ads for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own sponsored ads"
  on sponsored_ads for update
  using (auth.uid() = user_id);

create policy "Users can delete their own sponsored ads"
  on sponsored_ads for delete
  using (auth.uid() = user_id);

-- Create policies for cross_promotions
create policy "Users can view their own cross promotions"
  on cross_promotions for select
  using (auth.uid() = user_id);

create policy "Users can create their own cross promotions"
  on cross_promotions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own cross promotions"
  on cross_promotions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own cross promotions"
  on cross_promotions for delete
  using (auth.uid() = user_id);

-- Create policies for subscription_tiers
create policy "Users can view their own subscription tiers"
  on subscription_tiers for select
  using (auth.uid() = user_id);

create policy "Users can create their own subscription tiers"
  on subscription_tiers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own subscription tiers"
  on subscription_tiers for update
  using (auth.uid() = user_id);

create policy "Users can delete their own subscription tiers"
  on subscription_tiers for delete
  using (auth.uid() = user_id);

-- Create policies for donations
create policy "Users can view their own donations"
  on donations for select
  using (auth.uid() = user_id);

create policy "Users can create their own donations"
  on donations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own donations"
  on donations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own donations"
  on donations for delete
  using (auth.uid() = user_id);

-- Create policies for donation_tiers
create policy "Users can view their own donation tiers"
  on donation_tiers for select
  using (auth.uid() = user_id);

create policy "Users can create their own donation tiers"
  on donation_tiers for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own donation tiers"
  on donation_tiers for update
  using (auth.uid() = user_id);

create policy "Users can delete their own donation tiers"
  on donation_tiers for delete
  using (auth.uid() = user_id);

-- Create policies for digital_products
create policy "Users can view their own digital products"
  on digital_products for select
  using (auth.uid() = user_id);

create policy "Users can create their own digital products"
  on digital_products for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own digital products"
  on digital_products for update
  using (auth.uid() = user_id);

create policy "Users can delete their own digital products"
  on digital_products for delete
  using (auth.uid() = user_id);

-- Create policies for affiliate_links
create policy "Users can view their own affiliate links"
  on affiliate_links for select
  using (auth.uid() = user_id);

create policy "Users can create their own affiliate links"
  on affiliate_links for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own affiliate links"
  on affiliate_links for update
  using (auth.uid() = user_id);

create policy "Users can delete their own affiliate links"
  on affiliate_links for delete
  using (auth.uid() = user_id);

-- Create policies for affiliate_referrals
create policy "Users can view their own affiliate referrals"
  on affiliate_referrals for select
  using (auth.uid() = user_id);

create policy "Users can create their own affiliate referrals"
  on affiliate_referrals for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own affiliate referrals"
  on affiliate_referrals for update
  using (auth.uid() = user_id);

create policy "Users can delete their own affiliate referrals"
  on affiliate_referrals for delete
  using (auth.uid() = user_id);

-- Create policies for monetization_stats
create policy "Users can view their own monetization stats"
  on monetization_stats for select
  using (auth.uid() = user_id);

create policy "Users can create their own monetization stats"
  on monetization_stats for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own monetization stats"
  on monetization_stats for update
  using (auth.uid() = user_id);

create policy "Users can delete their own monetization stats"
  on monetization_stats for delete
  using (auth.uid() = user_id); 
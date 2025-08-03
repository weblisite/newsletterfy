# 🔄 Polar.sh + Supabase Integration Guide

This document explains how Polar.sh payments integrate with your Supabase database and authentication system in Newsletterfy.

## 🏗️ Database Architecture

### **1. New Database Tables**

#### **`platform_subscriptions`** - Core subscription tracking
```sql
CREATE TABLE platform_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id), -- Supabase Auth user
  polar_subscription_id TEXT UNIQUE,      -- Polar's subscription ID
  polar_checkout_id TEXT,                 -- Polar's checkout session ID
  plan_type TEXT,                         -- 'Free', 'Pro', 'Business', 'Enterprise'
  subscriber_limit INTEGER,               -- 1000, 5000, 10000, etc.
  status TEXT,                           -- 'active', 'cancelled', 'expired'
  payment_status TEXT,                   -- 'active', 'cancelled', 'unpaid'
  amount DECIMAL(10, 2),                 -- Monthly price in dollars
  currency TEXT DEFAULT 'USD',
  billing_cycle TEXT DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  payment_provider TEXT DEFAULT 'polar',
  customer_name TEXT,
  customer_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`platform_orders`** - One-time purchases
```sql
CREATE TABLE platform_orders (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  polar_order_id TEXT UNIQUE,
  amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  status TEXT, -- 'pending', 'completed', 'cancelled', 'refunded'
  customer_name TEXT,
  customer_email TEXT,
  payment_provider TEXT DEFAULT 'polar',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`users` table updates**
```sql
ALTER TABLE users 
ADD COLUMN plan_type TEXT DEFAULT 'Free',
ADD COLUMN subscriber_limit INTEGER DEFAULT 1000,
ADD COLUMN subscription_status TEXT DEFAULT 'active';
```

## 🔄 Complete Payment Flow

### **Step 1: User Selects Plan on Landing Page**

```javascript
// User selects "Pro - 5,000 subscribers - $49/month"
const handleProPlanClick = () => {
  const planData = {
    type: 'Pro',           // Plan type
    subscribers: 5000,     // Selected tier
    price: 49             // Price
  };
  checkAuthAndProceed(planData);
};
```

### **Step 2: Authentication Check**

```javascript
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  // Redirect to signup with plan data
  window.location.href = `/auth/signup?plan=Pro&tier=5000&price=49`;
} else {
  // User is authenticated, proceed to payment
  createPolarCheckout(planData);
}
```

### **Step 3: Polar Checkout Creation**

```javascript
// API: /api/payments/polar-checkout
const checkoutResponse = await polar.checkouts.checkoutsCreate({
  productId: 'cdebf919-ef1b-4d7c-8388-8798c6a5bb71', // Pro 5K product
  customerEmail: session.user.email,
  customerName: session.user.user_metadata?.full_name,
  metadata: {
    user_id: session.user.id,           // Supabase user ID
    customer_email: session.user.email,
    customer_name: session.user.user_metadata?.full_name,
    plan_type: 'Pro',
    subscriber_tier: '5000',
    source: 'newsletterfy_landing'
  }
});

// Store pending subscription in database
await supabase
  .from('platform_subscriptions')
  .insert([{
    user_id: session.user.id,
    plan_type: 'Pro',
    subscriber_limit: 5000,
    status: 'pending',
    payment_status: 'incomplete',
    polar_checkout_id: checkoutResponse.id,
    // ... other fields
  }]);
```

### **Step 4: User Completes Payment**

- User is redirected to Polar's secure checkout page
- User enters payment details and completes purchase
- Polar processes payment and creates subscription

### **Step 5: Webhook Updates Database**

When payment is successful, Polar sends a webhook to `/api/webhooks/polar`:

```javascript
// Webhook handler receives 'subscription.created' event
async function handleSubscriptionCreated(supabase, subscription) {
  const metadata = subscription.metadata;
  
  // 1. Update platform_subscriptions table
  await supabase
    .from('platform_subscriptions')
    .upsert({
      user_id: metadata.user_id,
      polar_subscription_id: subscription.id,
      plan_type: metadata.plan_type,        // 'Pro'
      subscriber_limit: parseInt(metadata.subscriber_tier), // 5000
      status: 'active',
      payment_status: 'active',
      amount: subscription.amount / 100,    // $49.00
      current_period_start: subscription.currentPeriodStart,
      current_period_end: subscription.currentPeriodEnd,
      // ... other fields
    });

  // 2. Update users table
  await supabase
    .from('users')
    .update({
      plan_type: 'Pro',
      subscriber_limit: 5000,
      subscription_status: 'active'
    })
    .eq('id', metadata.user_id);
}
```

### **Step 6: User Access Control**

Throughout your app, user access is controlled by checking their plan:

```javascript
// Get user's current plan
const { data: user } = await supabase
  .from('users')
  .select('plan_type, subscriber_limit, subscription_status')
  .eq('id', session.user.id)
  .single();

// Check if user can access feature
if (user.plan_type === 'Free' && requestedAction === 'create_newsletter') {
  // Check newsletter count limit
  const { count: newsletterCount } = await supabase
    .from('newsletters')
    .select('*', { count: 'exact' })
    .eq('user_id', session.user.id);
    
  if (newsletterCount >= 1) {
    return { error: 'Free plan limited to 1 newsletter. Upgrade to Pro.' };
  }
}

if (user.subscriber_limit < currentSubscribers) {
  return { error: `Plan limited to ${user.subscriber_limit} subscribers. Upgrade your plan.` };
}
```

## 🔧 Key Integration Points

### **1. User Authentication**
- **Supabase Auth** handles user login/signup
- **User ID** is stored in Polar metadata for webhook matching
- **Email matching** as fallback if user_id is missing

### **2. Plan Mapping**
```javascript
function getPolarProductId(planType, subscriberTier) {
  const POLAR_PRODUCTS = {
    'Pro': {
      1000: '561bb871-146c-4552-8eff-661fb7d8e337',   // $29
      5000: 'cdebf919-ef1b-4d7c-8388-8798c6a5bb71',   // $49
      // ... all 7 tiers
    },
    'Business': {
      1000: '290a8b0d-44cb-4edb-88b5-dbea483c8664',   // $89
      // ... all 7 tiers
    }
  };
  return POLAR_PRODUCTS[planType]?.[subscriberTier];
}
```

### **3. Webhook Security**
```javascript
// Verify webhook signature
const expectedSignature = crypto
  .createHmac('sha256', process.env.POLAR_WEBHOOK_SECRET)
  .update(body)
  .digest('hex');

if (signature !== `sha256=${expectedSignature}`) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

### **4. Subscription Lifecycle**
- **Created**: User gets access to paid features
- **Updated**: Billing period renewed, access continues
- **Cancelled**: User downgraded to Free plan
- **Expired**: Access revoked, features limited

## 📊 User Experience Flow

1. **Landing Page**: User selects pricing tier → Dynamic pricing updates
2. **Authentication**: Login/signup with plan data preserved
3. **Payment**: Secure Polar checkout with saved plan selection
4. **Confirmation**: Redirect to success page with access granted
5. **Dashboard**: Immediate access to plan features
6. **Ongoing**: Automatic renewals, webhooks keep access current

## 🔍 Database Queries for Common Operations

### **Get User's Current Plan**
```sql
SELECT plan_type, subscriber_limit, subscription_status 
FROM users 
WHERE id = $1;
```

### **Get User's Subscription Details**
```sql
SELECT ps.*, u.email 
FROM platform_subscriptions ps
JOIN users u ON ps.user_id = u.id
WHERE ps.user_id = $1 AND ps.status = 'active';
```

### **Check Feature Access**
```sql
SELECT 
  CASE 
    WHEN plan_type = 'Free' THEN 1
    WHEN plan_type = 'Pro' THEN 5
    WHEN plan_type = 'Business' THEN 50
    WHEN plan_type = 'Enterprise' THEN -1
  END as max_newsletters
FROM users 
WHERE id = $1;
```

## 🚨 Error Handling

### **Webhook Failures**
- Webhooks are retried automatically by Polar
- Log all webhook events for debugging
- Graceful degradation if webhook fails

### **Payment Failures**
- User remains on current plan until payment succeeds
- Grace period for expired subscriptions
- Clear error messages for payment issues

### **Database Sync Issues**
- Webhook updates both `platform_subscriptions` and `users` tables
- Fallback mechanisms for user identification
- Monitoring for data consistency

This integration ensures seamless payment processing with robust user access control! 🎉
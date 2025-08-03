# Polar.sh Migration Guide for Newsletterfy

This guide will help you migrate from IntaSend to Polar.sh payment processing.

## 🚀 Why Polar.sh?

- **Lower fees**: 4% + 40¢ (vs 5-6% typical)
- **Merchant of Record**: Handles international taxes automatically
- **Developer-friendly**: Modern API with excellent documentation
- **No monthly fees**: Only pay per transaction
- **Built-in subscriptions**: Perfect for SaaS pricing tiers
- **International support**: Accept payments globally

## 📋 Step-by-Step Migration

### Step 1: Set up Polar.sh Account

1. **Sign up at [polar.sh](https://polar.sh/signup)**
   - Use your GitHub account for easy signup
   - Create an organization for Newsletterfy

2. **Get your API credentials**
   - Go to Organization Settings → API
   - Create a new Organization Access Token
   - Copy the token (starts with `polar_at_`)

3. **Set up your organization**
   - Add organization details
   - Set up payout methods
   - Configure tax settings

### Step 2: Create Polar Products

You need to create products in Polar that match your current pricing structure:

#### Pro Plan Products (7 tiers)
```
Product Name: "Newsletterfy Pro - 1,000 Subscribers"
Price: $29/month
Billing: Monthly subscription
Description: "Advanced newsletter features for up to 1,000 subscribers"

Product Name: "Newsletterfy Pro - 5,000 Subscribers"  
Price: $49/month
...and so on for each tier
```

#### Business Plan Products (7 tiers)
```
Product Name: "Newsletterfy Business - 1,000 Subscribers"
Price: $89/month
Billing: Monthly subscription
Description: "Business features for up to 1,000 subscribers"
...and so on for each tier
```

#### Enterprise Plan
```
Product Name: "Newsletterfy Enterprise"
Price: Custom (or $299/month as starting point)
Billing: Monthly subscription  
Description: "Enterprise features with custom pricing"
```

### Step 3: Configure Environment Variables

Update your `.env.local` file with:

```env
# Polar.sh Configuration
POLAR_ACCESS_TOKEN=polar_at_your_actual_token_here
POLAR_ORGANIZATION_ID=your_organization_id
POLAR_WEBHOOK_SECRET=your_webhook_secret

# Product IDs (get these from Polar dashboard after creating products)
POLAR_PRO_1K_PRODUCT_ID=prod_actual_product_id
POLAR_PRO_5K_PRODUCT_ID=prod_actual_product_id
POLAR_PRO_10K_PRODUCT_ID=prod_actual_product_id
POLAR_PRO_25K_PRODUCT_ID=prod_actual_product_id
POLAR_PRO_50K_PRODUCT_ID=prod_actual_product_id
POLAR_PRO_75K_PRODUCT_ID=prod_actual_product_id
POLAR_PRO_100K_PRODUCT_ID=prod_actual_product_id

POLAR_BUSINESS_1K_PRODUCT_ID=prod_actual_product_id
POLAR_BUSINESS_5K_PRODUCT_ID=prod_actual_product_id
POLAR_BUSINESS_10K_PRODUCT_ID=prod_actual_product_id
POLAR_BUSINESS_25K_PRODUCT_ID=prod_actual_product_id
POLAR_BUSINESS_50K_PRODUCT_ID=prod_actual_product_id
POLAR_BUSINESS_75K_PRODUCT_ID=prod_actual_product_id
POLAR_BUSINESS_100K_PRODUCT_ID=prod_actual_product_id

POLAR_ENTERPRISE_PRODUCT_ID=prod_actual_product_id
```

### Step 4: Set up Webhooks

1. **In Polar Dashboard**:
   - Go to Developer Settings → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/polar`
   - Select events: `subscription.created`, `subscription.updated`, `subscription.cancelled`, `order.created`
   - Generate and save webhook secret

2. **Add webhook secret to env**:
   ```env
   POLAR_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

### Step 5: Database Schema Updates

Add new columns to support Polar:

```sql
-- Add Polar-specific columns to subscriptions table
ALTER TABLE subscriptions ADD COLUMN polar_subscription_id VARCHAR(255) UNIQUE;
ALTER TABLE subscriptions ADD COLUMN polar_checkout_id VARCHAR(255);

-- Add orders table for one-time purchases
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  polar_order_id VARCHAR(255) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  payment_provider VARCHAR(50) DEFAULT 'polar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Step 6: Testing

1. **Use Polar Sandbox**:
   - Set `NODE_ENV=development` to use sandbox
   - Create test products in sandbox
   - Test all pricing tiers

2. **Test Flow**:
   ```
   User selects plan → Polar checkout → Payment → Webhook → User activated
   ```

### Step 7: Go Live

1. **Switch to Production**:
   - Set `NODE_ENV=production` 
   - Use production Polar tokens
   - Update webhook URLs to production

2. **Monitor**:
   - Check webhook delivery logs
   - Monitor subscription activations
   - Verify user upgrades work

## 🔧 Integration Benefits

### For Users:
- **International payments**: Accept customers globally
- **Better UX**: Modern, mobile-optimized checkout
- **More payment methods**: Cards, Apple Pay, Google Pay
- **Automatic tax handling**: No more tax complexity

### For You:
- **Lower fees**: Save 20% on transaction costs
- **Better analytics**: Built-in revenue analytics
- **Automatic dunning**: Handle failed payments automatically
- **Developer tools**: Excellent API and webhooks

## 🎯 Pricing Plan Mapping

| Current Plan | Polar Product | Benefits |
|-------------|---------------|----------|
| Free | No payment needed | Direct database activation |
| Pro 1K-100K | 7 Polar products | Monthly subscriptions |
| Business 1K-100K | 7 Polar products | Monthly subscriptions |
| Enterprise | 1 Polar product | Custom pricing/manual sales |

## 📞 Support

- **Polar Documentation**: [docs.polar.sh](https://docs.polar.sh)
- **Polar Discord**: Get help from the community
- **Integration Issues**: Check webhook delivery logs first

## 🚨 Important Notes

1. **Keep IntaSend as fallback**: Don't remove immediately
2. **Test thoroughly**: Verify all subscription flows
3. **Monitor webhooks**: Ensure proper event handling
4. **Customer communication**: Notify users about improved checkout
5. **Gradual rollout**: Consider A/B testing the new flow

Your migration is now complete! Users will enjoy a better payment experience while you save on fees and get better tools. 🎉
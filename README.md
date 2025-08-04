# Newsletterfy Platform

A comprehensive newsletter platform with monetization features including donations, subscriptions, and ad placements.

## Features

- Newsletter creation and management
- Email marketing automation
- Donation system with multiple tiers
- Subscription management
- Ad placement and monetization
- Brand partnerships
- Analytics and reporting
- User management

## Payment Integration

This platform uses **IntaSend** for all payment processing, supporting:

- 💳 **Credit/Debit Cards** - Visa, Mastercard, American Express
- 📱 **M-Pesa** - Mobile money payments (Kenya)
- 🏦 **Bank Transfers** - Direct bank payments
- 💰 **Recurring Subscriptions** - Monthly and yearly billing
- 🌍 **Multi-currency** - USD, KES, and more

### IntaSend Setup

1. Sign up at [IntaSend](https://developers.intasend.com)
2. Get your API keys from the dashboard
3. Add the following environment variables:

```env
# IntaSend Configuration
INTASEND_PUBLISHABLE_KEY=ISPubKey_test_your_key_here
INTASEND_SECRET_KEY=ISSecretKey_test_your_secret_here

# App Configuration  
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

For production, replace `test` keys with `live` keys and set `NODE_ENV=production`.

## Environment Variables

Create a `.env.local` file with the following essential variables:

```env
# Supabase Configuration (Database & Storage)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Polar.sh Payment Processing
POLAR_ACCESS_TOKEN=polar_at_your_access_token_here
POLAR_ORGANIZATION_ID=your_polar_organization_id
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret

# Better-Auth Configuration
BETTER_AUTH_SECRET=your_random_secret_key
BETTER_AUTH_URL=http://localhost:3000

# Email Configuration (Choose one)
SENDGRID_API_KEY=SG.your_sendgrid_api_key_here
# OR
ELASTIC_EMAIL_API_KEY=your_elastic_email_api_key_here
EMAIL_PROVIDER=sendgrid

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Note:** The `.env.local` file is gitignored for security. Never commit real API keys to version control.

## Getting Started

1. **Clone the repository**
```bash
git clone <repository-url>
cd newsletterfy
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create `.env.local` file with the variables above.

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## Payment Flow

### Donations
1. Users visit `/donate/[creator-id]` 
2. Select donation tier or custom amount
3. Choose payment method (Card, M-Pesa, Bank)
4. Complete payment via IntaSend
5. Receive confirmation and creator gets notified

### Subscriptions
1. Users view subscription plans
2. Select monthly or yearly billing
3. Choose payment method
4. Automatic recurring billing via IntaSend
5. Manage subscription in user dashboard

### M-Pesa Integration
For M-Pesa payments:
- Phone number in international format (254XXXXXXXXX)
- Supports STK Push for seamless payment
- Real-time payment confirmation

## API Endpoints

### Donations
- `GET /api/donations/creator/[id]` - Get creator and donation tiers
- `POST /api/donations/process` - Process donation payment
- `POST /api/webhooks/intasend` - Handle payment webhooks

### Subscriptions  
- `GET /api/subscriptions/intasend` - Get subscription plans
- `POST /api/subscriptions/intasend` - Create subscription plan
- `POST /api/subscriptions/subscribe` - Subscribe to plan
- `GET /api/subscriptions/subscribe?email=user@example.com` - Get user subscriptions

## Database Schema

Key tables:
- `users` - User accounts
- `donation_tiers` - Donation tier configurations
- `donations` - Donation records
- `subscription_plans` - Available subscription plans
- `subscriptions` - User subscriptions
- `subscription_revenue_tracking` - Payment tracking

## Development

### Adding New Payment Methods

IntaSend supports additional payment methods that can be easily integrated:

1. **Google Pay** - For quick mobile payments
2. **Bank Transfers** - Direct bank account payments  
3. **Wallet Payments** - IntaSend wallet system

### Webhook Handling

Payment confirmations are handled via webhooks at `/api/webhooks/intasend`. The webhook:

1. Verifies payment status
2. Updates donation/subscription records
3. Sends confirmation emails
4. Updates user analytics

### Testing Payments

Use IntaSend test environment:
- Test cards: 4242 4242 4242 4242
- Test M-Pesa: Use sandbox phone numbers
- Test amounts: Any amount works in test mode

## Production Deployment

1. **Update environment variables**
   - Set production IntaSend keys
   - Update `NEXT_PUBLIC_APP_URL` to your domain
   - Set `NODE_ENV=production`

2. **Configure webhooks**
   - Set webhook URL in IntaSend dashboard
   - Point to `https://yourdomain.com/api/webhooks/intasend`

3. **SSL Certificate**
   - Ensure HTTPS is enabled for payment security

## Support

For payment integration support:
- [IntaSend Documentation](https://developers.intasend.com/docs/introduction)
- [IntaSend Support](https://developers.intasend.com)

For platform support:
- Check the issues section
- Review the documentation
- Contact the development team

## License

[Your License Here]
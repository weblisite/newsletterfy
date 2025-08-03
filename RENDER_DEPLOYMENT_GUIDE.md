# 🚀 Render Deployment Guide for Newsletterfy

This guide covers the complete deployment process for your Newsletterfy platform on Render, including both frontend and backend components.

## 📋 Pre-Deployment Checklist

### ✅ **Required Environment Variables**

Copy these environment variables from your `.env.local` to Render:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Polar.sh Payment Processing
POLAR_ACCESS_TOKEN=polar_oat_zKreRyaoWV91hklgpWvIZIgtfzt4UJHFBwQOI3CghgL
POLAR_ORGANIZATION_ID=d96c53d9-d12a-4533-8bb1-062ddad9f7cd
POLAR_WEBHOOK_SECRET=your_webhook_secret_here

# Application URLs (Update for production)
NEXT_PUBLIC_APP_URL=https://your-app-name.onrender.com
NEXTAUTH_URL=https://your-app-name.onrender.com

# TinyMCE (Required for newsletter editor)
NEXT_PUBLIC_TINYMCE_API_KEY=your_tinymce_api_key

# Email Service (Optional - for notifications)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@your-domain.com

# Payment Provider Fallbacks (Optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key
INTASEND_PUBLISHABLE_KEY=your_intasend_public_key
INTASEND_SECRET_KEY=your_intasend_secret_key
```

## 🔧 **Render Configuration**

### **Frontend Deployment (Next.js)**

1. **Create Web Service**
   - Connect your GitHub repository
   - Select "Web Service"
   - Choose "Node" environment

2. **Build & Start Commands**
   ```bash
   # Build Command
   npm install && npm run build
   
   # Start Command  
   npm start
   ```

3. **Environment Variables**
   - Add all variables from the checklist above
   - Ensure `NEXT_PUBLIC_APP_URL` matches your Render URL

4. **Advanced Settings**
   ```
   Node Version: 18.x
   Auto-Deploy: Yes
   Health Check Path: /
   ```

### **Backend Deployment (Optional API Routes)**

If you have separate backend services:

1. **Create Web Service**
   - Repository: Same repo, backend folder
   - Root Directory: `backend`
   
2. **Commands**
   ```bash
   # Build Command
   cd backend && npm install
   
   # Start Command
   cd backend && npm start
   ```

## 🔐 **Polar.sh Webhook Configuration**

After deployment, configure Polar webhooks:

1. **Go to Polar Dashboard → Settings → Webhooks**
2. **Add Webhook URL:**
   ```
   https://your-app-name.onrender.com/api/webhooks/polar
   ```
3. **Select Events:**
   - `subscription.created`
   - `subscription.updated` 
   - `subscription.cancelled`
   - `order.created`

4. **Get Webhook Secret:**
   - Copy the webhook secret
   - Add it to Render environment variables as `POLAR_WEBHOOK_SECRET`

## 🗄️ **Database Migration**

Your Supabase database is already configured with Polar integration tables. No additional migration needed.

## 🧪 **Post-Deployment Testing**

### **1. Test Authentication Flow**
- [ ] Visit your Render URL
- [ ] Click "Get Started" → select a plan
- [ ] Sign up with new account
- [ ] Verify email confirmation works
- [ ] Check dashboard access

### **2. Test Payment Flow**
- [ ] Select a paid plan (Pro/Business)
- [ ] Complete Polar checkout
- [ ] Verify webhook updates database
- [ ] Check dashboard shows correct plan

### **3. Test Features**
- [ ] Create newsletter
- [ ] Test subscriber management
- [ ] Verify plan limits enforcement
- [ ] Test monetization features

## 📊 **Monitoring & Logs**

### **Render Dashboard**
- Monitor deployment logs
- Check service health
- View metrics and usage

### **Supabase Dashboard**
- Monitor database performance
- Check user authentication
- Review subscription data

### **Polar Dashboard**
- Track payment processing
- Monitor subscription status
- Review webhook delivery logs

## 🚨 **Common Issues & Solutions**

### **Build Failures**
```bash
# If Node.js version issues
echo "18.17.0" > .nvmrc

# If dependency issues
rm -rf node_modules package-lock.json
npm install
```

### **Environment Variable Issues**
- Ensure all `NEXT_PUBLIC_` variables are set
- Double-check Polar access token format
- Verify Supabase URLs are correct

### **Webhook Issues**
- Check webhook endpoint returns 200
- Verify webhook secret matches
- Test webhook manually with curl

### **Database Connection Issues**
- Verify Supabase service role key
- Check RLS policies are correct
- Ensure migration completed successfully

## 🔄 **Continuous Deployment**

With GitHub integration:
1. **Push to main branch** → Auto-deploys
2. **Environment updates** → Restart service
3. **Database changes** → Run migrations via Supabase CLI

## 📞 **Support & Troubleshooting**

If deployment issues occur:
1. Check Render build logs
2. Verify all environment variables
3. Test database connections
4. Check Polar webhook logs
5. Review Supabase auth settings

Your Newsletterfy platform is now ready for production deployment on Render! 🎉
import { betterAuth } from "better-auth";
import { polar } from "@polar-sh/better-auth";
// Using default database adapter for now - check Better-Auth docs for Supabase adapter
// import { Database } from "better-auth/adapters/supabase";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for Better-Auth
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const auth = betterAuth({
  // Temporarily disable database for build - TODO: Fix Better-Auth Supabase adapter
  // database: new Database(supabase),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Temporarily disable for build
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    polar({
      // Polar configuration
      baseURL: process.env.POLAR_API_URL || "https://api.polar.sh",
      accessToken: process.env.POLAR_ACCESS_TOKEN,
      organizationId: process.env.POLAR_ORGANIZATION_ID,
      
      // Product mapping for our pricing tiers
      products: {
        // Pro Plan Products
        "pro_1k": "561bb871-146c-4552-8eff-661fb7d8e337",
        "pro_5k": "cdebf919-ef1b-4d7c-8388-8798c6a5bb71", 
        "pro_10k": "1cf27351-6eb8-43a1-8103-caf4786c647c",
        "pro_25k": "2e91dbea-3c1a-4706-93cd-9b5a5133fd82",
        "pro_50k": "d7951e00-0538-4098-a560-5844d37df035",
        "pro_75k": "670efd8b-fc0d-4932-b23d-a0fc3db46896",
        "pro_100k": "2fe4c45b-8fa6-4283-83da-8e3c8fa787b5",
        
        // Business Plan Products
        "business_1k": "290a8b0d-44cb-4edb-88b5-dbea483c8664",
        "business_5k": "de5ea4bc-470d-4383-972f-ae0f1bf1b1c6",
        "business_10k": "34ee840a-ac5d-42cd-9b02-78bb05501a9f",
        "business_25k": "484650d9-273a-4743-a6c3-9a4b0ffa22eb",
        "business_50k": "6f2a4e26-a1d0-4fea-89dd-ba812270b4e1",
        "business_75k": "55e78601-7479-42d5-bc52-e7effe5bd92b",
        "business_100k": "a30b5754-b298-4f80-94f8-aee0f4062337",
      },
      
      // Webhook configuration
      webhookSecret: process.env.POLAR_WEBHOOK_SECRET,
      
      // Custom metadata for users
      metadata: {
        source: "newsletterfy"
      },
      
      // Success and cancel URLs
      successURL: "/user-dashboard?welcome=true",
      cancelURL: "/pricing",
      
      // No trial period - paid plans require immediate payment
    }),
  ],
  
  // Custom session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 24 hours
  },
  
  // Custom user fields
  user: {
    additionalFields: {
      planType: {
        type: "string",
        defaultValue: "Free",
      },
      subscriberLimit: {
        type: "number", 
        defaultValue: 1000,
      },
      subscriptionStatus: {
        type: "string",
        defaultValue: "active",
      },
    },
  },
  
  // Custom callbacks
  callbacks: {
    async signUp({ user, account }) {
      console.log("User signed up:", user.email);
      
      // Start with Free plan (permanent free tier)
      const defaultPlan = {
        planType: "Free",
        subscriberLimit: 1000,
        subscriptionStatus: "active",
      };
      
      return {
        user: {
          ...user,
          ...defaultPlan,
        },
      };
    },
    
    async signIn({ user, account }) {
      console.log("User signed in:", user.email);
      return { user };
    },
  },
});

// Helper function to get product key for Polar plugin
export function getPolarProductKey(planType, subscriberTier) {
  const tierKey = `${subscriberTier / 1000}k`;
  return `${planType.toLowerCase()}_${tierKey}`;
}

// Helper function to upgrade user plan
export async function upgradePlan(userId, planType, subscriberTier) {
  const productKey = getPolarProductKey(planType, subscriberTier);
  
  try {
    // This will create a checkout session via Better-Auth Polar plugin
    const checkoutUrl = await auth.polar.createCheckout({
      userId,
      productKey,
      metadata: {
        planType,
        subscriberTier: subscriberTier.toString(),
        upgradeFlow: true,
      },
    });
    
    return { success: true, checkoutUrl };
  } catch (error) {
    console.error("Failed to create checkout:", error);
    return { success: false, error: error.message };
  }
}
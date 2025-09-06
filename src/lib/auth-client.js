import { createAuthClient } from "better-auth/react";

// Create auth client with error handling
let authClient;

try {
  authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  });
} catch (error) {
  console.warn('Auth client initialization failed:', error.message);
  // Create a minimal client for build time
  authClient = {
    useSession: () => ({ data: null, isPending: false }),
    signIn: () => Promise.reject(new Error('Auth not configured')),
    signUp: () => Promise.reject(new Error('Auth not configured')),
    signOut: () => Promise.reject(new Error('Auth not configured')),
    useUser: () => ({ data: null, isPending: false }),
  };
}

// Export commonly used hooks
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  useUser,
} = authClient;

export { authClient };

// Custom hook for plan management
export function usePlan() {
  const { data: session } = useSession();
  const user = session?.user;
  
  return {
    planType: user?.planType || "Free",
    subscriberLimit: user?.subscriberLimit || 1000,
    subscriptionStatus: user?.subscriptionStatus || "active",
    isActive: user?.subscriptionStatus === "active",
    isPaid: user?.planType !== "Free",
  };
}

// Helper to upgrade plan
export async function upgradePlan(planType, subscriberTier) {
  try {
    const response = await fetch("/api/auth/polar/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        planType,
        subscriberTier,
      }),
    });
    
    const data = await response.json();
    
    if (data.success && data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      throw new Error(data.error || "Failed to create checkout");
    }
  } catch (error) {
    console.error("Upgrade failed:", error);
    throw error;
  }
}
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Export commonly used hooks
export const {
  useSession,
  signIn,
  signUp,
  signOut,
  useUser,
} = authClient;

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
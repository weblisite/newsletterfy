// Temporary fallback auth client to prevent webpack issues
// TODO: Implement proper Better-Auth integration once webpack issues are resolved

// Mock auth client for now
const mockAuthClient = {
  useSession: () => ({ data: null, isPending: false }),
  signIn: () => Promise.reject(new Error('Auth not configured')),
  signUp: () => Promise.reject(new Error('Auth not configured')),
  signOut: () => Promise.reject(new Error('Auth not configured')),
  useUser: () => ({ data: null, isPending: false }),
};

// Export hooks
export const useSession = mockAuthClient.useSession;
export const signIn = mockAuthClient.signIn;
export const signUp = mockAuthClient.signUp;
export const signOut = mockAuthClient.signOut;
export const useUser = mockAuthClient.useUser;

// Export the client
export const authClient = mockAuthClient;

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
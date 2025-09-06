// Clerk client-side hooks and utilities
import { 
  useUser as useClerkUser, 
  useAuth as useClerkAuth,
  SignInButton,
  SignUpButton,
  UserButton,
  SignOutButton
} from '@clerk/nextjs';

// Re-export Clerk hooks with consistent naming
export const useUser = useClerkUser;
export const useAuth = useClerkAuth;

// Create a session hook that matches the previous API
export function useSession() {
  const { user, isLoaded } = useClerkUser();
  const { isSignedIn } = useClerkAuth();
  
  return {
    data: isSignedIn ? { user } : null,
    isPending: !isLoaded,
  };
}

// Auth actions
export function signIn() {
  // This will be handled by Clerk's SignInButton component
  console.log('Use SignInButton component for sign in');
}

export function signUp() {
  // This will be handled by Clerk's SignUpButton component
  console.log('Use SignUpButton component for sign up');
}

export function signOut() {
  // This will be handled by Clerk's SignOutButton component
  console.log('Use SignOutButton component for sign out');
}

// Export Clerk components
export { SignInButton, SignUpButton, UserButton, SignOutButton };

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
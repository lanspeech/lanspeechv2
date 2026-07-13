import { useAuth } from '../contexts/AuthContext';
import { isSubscriptionActive, getDaysRemaining } from '../lib/billing';

interface UseSubscriptionResult {
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number | null;
  subscriptionExpiresAt: string | null;
}

/**
 * Hook to check subscription status for the authenticated user
 * @returns object with subscription status information
 */
export function useSubscription(): UseSubscriptionResult {
  const { profile } = useAuth();
  
  const subscriptionExpiresAt = profile?.subscription_expires_at ?? null;
  const isActive = isSubscriptionActive(subscriptionExpiresAt);
  const isExpired = subscriptionExpiresAt !== null && !isActive;
  const daysRemaining = getDaysRemaining(subscriptionExpiresAt);

  return {
    isActive,
    isExpired,
    daysRemaining,
    subscriptionExpiresAt,
  };
}

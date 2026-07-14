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
  const isAdmin = profile?.is_admin === true;
  const isActive = isAdmin || isSubscriptionActive(subscriptionExpiresAt);
  const isExpired = !isAdmin && subscriptionExpiresAt !== null && !isActive;
  const daysRemaining = isAdmin ? null : getDaysRemaining(subscriptionExpiresAt);

  return {
    isActive,
    isExpired,
    daysRemaining,
    subscriptionExpiresAt,
  };
}

/**
 * Billing and subscription utilities for LanSpeech
 */

/**
 * Check if a subscription is active based on expiration timestamp
 * @param subscriptionExpiresAt - ISO 8601 timestamp or null
 * @returns true if subscription is active, false if expired or not subscribed
 */
export function isSubscriptionActive(subscriptionExpiresAt: string | null): boolean {
  if (!subscriptionExpiresAt) {
    return false;
  }

  try {
    const expirationDate = new Date(subscriptionExpiresAt);
    const now = new Date();
    
    // Subscription is active if expiration date is in the future
    return expirationDate > now;
  } catch {
    console.error('Invalid subscription expiration date:', subscriptionExpiresAt);
    return false;
  }
}

/**
 * Get the number of days remaining until subscription expires
 * @param subscriptionExpiresAt - ISO 8601 timestamp or null
 * @returns number of days remaining, or null if not subscribed
 */
export function getDaysRemaining(subscriptionExpiresAt: string | null): number | null {
  if (!subscriptionExpiresAt) {
    return null;
  }

  try {
    const expirationDate = new Date(subscriptionExpiresAt);
    const now = new Date();
    const diffMs = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  } catch {
    console.error('Invalid subscription expiration date:', subscriptionExpiresAt);
    return null;
  }
}

/**
 * Format a subscription expiration date for display
 * @param subscriptionExpiresAt - ISO 8601 timestamp or null
 * @returns formatted date string or empty string
 */
export function formatExpirationDate(subscriptionExpiresAt: string | null): string {
  if (!subscriptionExpiresAt) {
    return '';
  }

  try {
    const date = new Date(subscriptionExpiresAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Pricing plans available
 */
export const PRICING_PLANS = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 4.99,
    currency: 'USD',
    billingCycle: 'Monthly',
    duration: '1 month',
    durationDays: 30,
    features: [
      'Unlimited practice sessions',
      'Full lesson library access',
      'Voice recording & playback',
      'Progress tracking',
      'AI-powered feedback',
      'Mobile app access',
      'Priority support',
    ],
    description: 'Perfect for getting started with your speech therapy practice.',
    popular: false,
  },
  {
    id: 'annual',
    name: 'Annual Plan',
    price: 39.99,
    currency: 'USD',
    billingCycle: 'Yearly',
    duration: '1 year',
    durationDays: 365,
    features: [
      'Unlimited practice sessions',
      'Full lesson library access',
      'Voice recording & playback',
      'Progress tracking',
      'AI-powered feedback',
      'Mobile app access',
      'Priority support',
      'Save 33% vs monthly',
    ],
    description: 'Best value. Commit to your speech therapy journey for a full year.',
    popular: true,
  },
] as const;

export type PricingPlanId = typeof PRICING_PLANS[number]['id'];

/**
 * Calculate subscription expiration date based on plan
 * @param planId - pricing plan ID
 * @returns ISO 8601 timestamp for when subscription expires
 */
export function calculateSubscriptionExpiration(planId: PricingPlanId): string {
  const plan = PRICING_PLANS.find((p) => p.id === planId);
  if (!plan) {
    throw new Error(`Unknown plan: ${planId}`);
  }

  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + plan.durationDays);
  
  return expirationDate.toISOString();
}

# LanSpeech Subscription System Setup Guide

## Overview

The subscription system in LanSpeech is designed to work seamlessly with Selar for payment processing. This guide explains how to set it up and maintain it.

## Components

### 1. Database Schema

**New Column**: `profiles.subscription_expires_at` (timestamptz)
- `NULL` = User has not subscribed
- `ISO 8601 timestamp` = Subscription active until this date

Run the migration:
```bash
npx supabase migration up
# Or manually apply: supabase/migrations/20260713120000_add_subscription_to_profiles.sql
```

### 2. Frontend Components

#### `useSubscription` Hook
```typescript
import { useSubscription } from '@/hooks/useSubscription';

function MyComponent() {
  const { isActive, isExpired, daysRemaining } = useSubscription();
  
  if (!isActive) {
    return <div>Please subscribe to continue</div>;
  }
  
  return <div>Your subscription expires in {daysRemaining} days</div>;
}
```

#### `ProtectedRoute` Component
Automatically wraps dashboard, library, lessons, and other premium features:
```typescript
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

When a user's subscription is expired:
1. ProtectedRoute detects this
2. Redirects to `/billing-expired`
3. User sees subscription renewal options

### 3. Pages

#### `/pricing`
- Shows Monthly ($4.99) and Annual ($39.99) plans
- Handles payment initiation with Selar
- Displays feature comparison and FAQ

#### `/billing-expired`
- Shown when subscription is expired or missing
- Clear explanation of what they're missing
- "Renew Subscription" button redirects to `/pricing`

### 4. Billing Utilities

```typescript
import { 
  isSubscriptionActive,
  getDaysRemaining,
  formatExpirationDate,
  PRICING_PLANS,
  calculateSubscriptionExpiration
} from '@/lib/billing';

// Check if subscription is active
const active = isSubscriptionActive(profile.subscription_expires_at);

// Get days until expiration
const days = getDaysRemaining(profile.subscription_expires_at);

// Format for display
const formatted = formatExpirationDate(profile.subscription_expires_at);
// Output: "July 13, 2027"

// Calculate expiration after purchase
const expiresAt = calculateSubscriptionExpiration('annual');
```

## Selar Integration

### Setup Steps

1. **Create Selar Account** (if you haven't already)
   - Go to https://selar.co
   - Sign up as a seller

2. **Create Products in Selar Dashboard**
   - Product 1: LanSpeech Monthly ($4.99)
   - Product 2: LanSpeech Annual ($39.99)

3. **Get Payment Links**
   - Copy the payment links from Selar
   - Update `/src/pages/Pricing.tsx`:
     ```typescript
     const SELAR_PAYMENT_LINKS = {
       monthly: 'https://selar.co/checkout/...', // Your monthly payment link
       annual: 'https://selar.co/checkout/...',   // Your annual payment link
     };
     ```

4. **Setup Webhook in Selar**
   - In Selar Dashboard → Settings → Webhooks
   - Add webhook URL: `https://your-domain.com/api/webhooks/selar`
   - Enable event: "Successful payment"
   - Copy webhook secret for environment variables

### Backend Webhook Handler

Create a backend endpoint to handle Selar webhooks (pseudo-code):

```typescript
// POST /api/webhooks/selar
export async function handleSelarWebhook(req: Request) {
  const signature = req.headers['x-selar-signature'];
  
  // Verify webhook signature
  if (!verifySelarSignature(req.body, signature)) {
    return { error: 'Invalid signature' };
  }

  const { customer_email, reference, product_id } = req.body;

  // Determine subscription duration based on product
  let durationDays = 30; // default monthly
  if (product_id === 'ANNUAL_PLAN_ID') {
    durationDays = 365;
  }

  // Calculate expiration
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  // Update user's subscription in Supabase
  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('user_id', getUserIdByEmail(customer_email));

  if (error) {
    console.error('Failed to update subscription:', error);
    return { error: 'Failed to update subscription' };
  }

  return { success: true };
}
```

### Environment Variables

Add to `.env`:
```
VITE_SELAR_MONTHLY_LINK=https://selar.co/checkout/...
VITE_SELAR_ANNUAL_LINK=https://selar.co/checkout/...
SELAR_WEBHOOK_SECRET=your_webhook_secret_here
```

## Testing

### Test Subscription Status

```typescript
// In browser console, after logging in:
const profile = await supabase
  .from('profiles')
  .select('subscription_expires_at')
  .eq('user_id', 'USER_ID')
  .single();

console.log(profile.data.subscription_expires_at);
```

### Test Expired Subscription

```typescript
// Manually expire a subscription in Supabase:
UPDATE profiles 
SET subscription_expires_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'USER_ID';

// Refresh the page, should redirect to /billing-expired
```

### Test Active Subscription

```typescript
// Give a user an active subscription:
UPDATE profiles 
SET subscription_expires_at = NOW() + INTERVAL '30 days'
WHERE user_id = 'USER_ID';

// Refresh the page, should show dashboard normally
```

## Renewal Flows

### Auto-Renewal (Optional)
To implement auto-renewal via Selar:
1. Create a subscription product in Selar (instead of one-time payment)
2. Update the payment flow to use subscription product
3. Selar will automatically charge and webhook after each cycle

### Manual Renewal
Current setup requires manual payment. Users visit `/pricing` and select a new plan to extend.

## Best Practices

1. **Always check before sensitive operations**
   ```typescript
   const { isActive } = useSubscription();
   if (!isActive) return null; // Don't render
   ```

2. **Handle edge cases**
   - Expired subscriptions: Redirect immediately
   - Null values: Treat as non-subscriber
   - Invalid dates: Treat as non-subscriber

3. **Log subscription events**
   ```typescript
   console.log(`Subscription status: ${isActive ? 'Active' : 'Expired'}`);
   console.log(`Days remaining: ${daysRemaining}`);
   ```

4. **Monitor webhook failures**
   - Log all webhook requests in Selar dashboard
   - Set up alerts for failed updates
   - Have a manual override in admin panel

## Troubleshooting

### User sees "Subscription Expired" but they just paid

**Solution**: 
1. Check Selar webhook delivery logs
2. Verify webhook is hitting your backend
3. Check backend logs for update errors
4. Manually trigger profile refresh in admin panel

### Pricing page doesn't redirect to payment

**Solution**:
1. Verify Selar payment links are correct in `.env`
2. Check browser console for errors
3. Verify window.location.href is working

### User can bypass subscription check

**Solution**:
1. ProtectedRoute checks must wrap all premium routes
2. Never trust client-side checks alone
3. Always verify subscription in backend before serving premium data

## Monitoring

### Key Metrics to Track

- Active subscription count
- Monthly renewal rate
- Churn rate (expired - not renewed)
- Average subscription duration
- Revenue by plan type

### Queries

```sql
-- Count active subscriptions
SELECT COUNT(*) FROM profiles 
WHERE subscription_expires_at > NOW();

-- Count expired subscriptions
SELECT COUNT(*) FROM profiles 
WHERE subscription_expires_at IS NOT NULL 
  AND subscription_expires_at < NOW();

-- Revenue (assuming stored amounts)
SELECT 
  COUNT(*) as transactions,
  SUM(amount) as total_revenue
FROM payment_transactions
WHERE status = 'success';
```

## Next Steps

1. ✅ Database migration applied
2. ⏳ Set up Selar account and products
3. ⏳ Add Selar payment links to `.env`
4. ⏳ Create backend webhook handler
5. ⏳ Test full payment flow
6. ⏳ Deploy to production
7. ⏳ Monitor webhook deliveries

## Support

For Selar-specific issues: https://selar.co/support
For app-specific issues: Check backend logs and Supabase dashboard

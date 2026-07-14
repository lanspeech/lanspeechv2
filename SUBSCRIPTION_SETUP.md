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

The app needs a backend endpoint to receive payment success events and update `profiles.subscription_expires_at` in Supabase.

You can deploy this as a Supabase Edge Function or any serverless endpoint.

#### Example Supabase Edge Function

Create `supabase/functions/selar-webhook/index.ts` with the following logic:

```ts
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const WEBHOOK_SECRET = Deno.env.get('SELAR_WEBHOOK_SECRET');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function verifySignature(payload: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  return signature === WEBHOOK_SECRET;
}

function getDurationDays(productId: string | null): number {
  if (!productId) return 30;
  return productId.toLowerCase().includes('annual') ? 365 : 30;
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('x-selar-signature');
  const bodyText = await req.text();

  if (!verifySignature(bodyText, signature)) {
    return new Response('Invalid signature', { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(bodyText);
  } catch (error) {
    return new Response('Invalid JSON body', { status: 400 });
  }

  const email = payload.customer_email ?? payload.email ?? payload.customerEmail;
  const productId = payload.product_id ?? payload.plan ?? payload.product;
  const paymentStatus = payload.payment_status ?? payload.status ?? 'paid';

  if (!email) {
    return new Response('Missing customer email', { status: 400 });
  }

  if (paymentStatus !== 'paid' && paymentStatus !== 'successful') {
    return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  const { data: user, error: userError } = await supabase.auth.admin.getUserByEmail(email);
  if (userError || !user) {
    return new Response('User not found', { status: 404 });
  }

  const durationDays = getDurationDays(String(productId));
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + durationDays);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ subscription_expires_at: expiresAt.toISOString() })
    .eq('user_id', user.id);

  if (updateError) {
    return new Response(`Failed to update subscription: ${updateError.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, expires_at: expiresAt.toISOString() }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
});
```

#### Zapier configuration

If you are using Zapier, send a POST from your payment trigger to this endpoint with JSON payload like:

```json
{
  "customer_email": "splendourkalu0@gmail.com",
  "product_id": "monthly",
  "payment_status": "paid"
}
```

Configure Zapier to include:
- `customer_email` or `email`
- `product_id` or `plan`
- `payment_status`

Use an additional header for your webhook secret, for example:
- `x-selar-signature: <your webhook secret>`

#### Environment Variables

Add to `.env`:
```bash
VITE_SELAR_MONTHLY_LINK=https://selar.co/checkout/...
VITE_SELAR_ANNUAL_LINK=https://selar.co/checkout/...
SELAR_WEBHOOK_SECRET=your_webhook_secret_here
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

> The `SUPABASE_SERVICE_ROLE_KEY` must be kept secret and is only used by the webhook backend.

### Zapier-compatible fallback

If you cannot deploy a backend endpoint yet, use Zapier's Supabase integration to update `profiles.subscription_expires_at` directly:
1. Add a Zap that triggers on successful payment.
2. Add a Supabase action to update the `profiles` row for the user.
3. Use the user's email to look up their `user_id` or map the row by a dedicated `email` field.
4. Set `subscription_expires_at` to `{{zap_meta_human_now}} + 30 days` for monthly or `+ 365 days` for annual.

This ensures successful payments immediately restore access in the frontend.

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

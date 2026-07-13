-- Add subscription management column to profiles table for payment automation

ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Create index for efficient subscription queries
CREATE INDEX IF NOT EXISTS profiles_subscription_expires_at
  ON public.profiles(subscription_expires_at DESC)
  WHERE subscription_expires_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.subscription_expires_at IS 
  'ISO 8601 timestamp indicating when the user''s subscription expires. 
   NULL means user has not subscribed. 
   Updated automatically by payment processor (Selar) webhook on successful payment.';

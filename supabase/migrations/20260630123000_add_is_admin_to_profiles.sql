-- Add is_admin flag to profiles to support admin users

ALTER TABLE IF EXISTS profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Allow selecting all profiles for admins via a helper policy (admins still must be granted via update)
-- Note: RLS policies remain owner-only; admin enforcement is handled in the app by checking `is_admin`.

-- Update existing rows default already applied; ensure index
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles(is_admin);

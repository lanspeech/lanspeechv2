-- Add helper function and RLS policies to allow admin users broader access

-- Helper function to check if the current authenticated user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND is_admin = true);
$$;

-- Allow admins to select any profile (owners can still select their own)
DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_profiles_owner_or_admin" ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- Allow admins to update profiles (owner can update their own)
DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_profiles_owner_or_admin" ON public.profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Allow admins to select lesson_completions to view learner progress
DROP POLICY IF EXISTS "select_own_completions" ON public.lesson_completions;
CREATE POLICY "select_completions_owner_or_admin" ON public.lesson_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- Allow admins to manage lesson_completions if necessary
DROP POLICY IF EXISTS "insert_own_completions" ON public.lesson_completions;
CREATE POLICY "insert_completions_owner_or_admin" ON public.lesson_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "update_own_completions" ON public.lesson_completions;
CREATE POLICY "update_completions_owner_or_admin" ON public.lesson_completions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id OR public.is_admin()) WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- Keep delete policy restricted to owner only for now
DROP POLICY IF EXISTS "delete_own_completions" ON public.lesson_completions;
CREATE POLICY "delete_completions_owner_only" ON public.lesson_completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

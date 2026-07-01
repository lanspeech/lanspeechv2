WITH u AS (SELECT id FROM auth.users WHERE email='splennet@gmail.com')
INSERT INTO public.profiles (user_id, display_name, is_admin)
SELECT u.id, 'splennet', true FROM u
ON CONFLICT (user_id) DO UPDATE SET is_admin = true, display_name = EXCLUDED.display_name;

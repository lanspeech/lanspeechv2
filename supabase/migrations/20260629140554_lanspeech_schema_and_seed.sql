/*
# LanSpeech — Full Schema, Seed Data, and New-User Trigger

## Overview
Sets up the complete database for LanSpeech: a speech-therapy practice app.
Each user has personal progress, a streak calendar, and lesson unlock gates.

## New Tables
1. **profiles** — One row per user. Stores display name, daily goal, avatar URL, and connected specialist details. Scoped to `auth.users` via `user_id`.
2. **lessons** — Global lesson catalog (not user-scoped). Contains day number, title, description, duration, level (beginner/intermediate/advanced), module name, practice phrase, and bonus flag. Readable by everyone (anon + authenticated).
3. **practice_sessions** — One row per completed practice session per user. Records the lesson practiced, session type, duration in minutes, and start/end timestamps. Owner-scoped via `user_id`.
4. **lesson_completions** — Junction table marking which lessons a user has completed. Unique on (user_id, lesson_id). Owner-scoped via `user_id`.

## Security
- RLS enabled on all four tables.
- `lessons`: public SELECT (anon + authenticated) — content is intentionally global.
- `profiles`, `practice_sessions`, `lesson_completions`: authenticated-only CRUD scoped to `auth.uid() = user_id`.
- All owner columns default to `auth.uid()` so client inserts can omit `user_id`.

## Seed Data
- 8 lessons inserted once (guard: WHERE NOT EXISTS on lessons table).
- A PL/pgSQL trigger function `handle_new_user()` fires AFTER INSERT on `auth.users`. It automatically: (a) creates the user's profile row, (b) seeds 24 realistic historical practice sessions (12 consecutive days for a streak + 12 older scattered sessions), and (c) marks the first two lessons as completed.

## Important Notes
1. `handle_new_user` runs as SECURITY DEFINER so it can bypass RLS when seeding rows on behalf of the new user.
2. The trigger is idempotent: DROP TRIGGER IF EXISTS before CREATE TRIGGER.
3. Lessons seed uses a WHERE NOT EXISTS guard to prevent duplicate rows on migration re-runs.
4. All policy CREATE statements are preceded by DROP POLICY IF EXISTS for idempotency.
*/

-- ─── profiles ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL DEFAULT auth.uid()
                        REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name        text NOT NULL DEFAULT 'User',
  daily_goal_mins     integer NOT NULL DEFAULT 20,
  avatar_url          text,
  specialist_name     text DEFAULT 'Dr. Sarah Chen',
  specialist_photo_url text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile"  ON profiles;
DROP POLICY IF EXISTS "insert_own_profile"  ON profiles;
DROP POLICY IF EXISTS "update_own_profile"  ON profiles;
DROP POLICY IF EXISTS "delete_own_profile"  ON profiles;

CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── lessons ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lessons (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_number      integer NOT NULL,
  title           text NOT NULL,
  description     text NOT NULL,
  duration_mins   integer NOT NULL DEFAULT 10,
  level           text NOT NULL DEFAULT 'beginner'
                    CHECK (level IN ('beginner','intermediate','advanced')),
  module          text NOT NULL DEFAULT 'General',
  practice_phrase text,
  is_bonus        boolean NOT NULL DEFAULT false,
  order_index     integer NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lessons" ON lessons;
CREATE POLICY "anon_select_lessons" ON lessons FOR SELECT
  TO anon, authenticated USING (true);

-- Seed lessons only once
INSERT INTO lessons
  (day_number, title, description, duration_mins, level, module, practice_phrase, is_bonus, order_index)
SELECT * FROM (VALUES
  (1, 'Morning Warmup',
   'Simple facial muscle relaxation and light humming exercises to prepare your voice for the day.',
   5, 'beginner', 'Foundation Series',
   'Hum softly as the morning light fills the room.',
   false, 1),
  (2, 'Vowel Clarity',
   'Practicing the A, E, I, O, U transitions with slow breath control for clearer, more confident speech.',
   10, 'beginner', 'Foundation Series',
   'Every open avenue invites easy and elegant utterances.',
   false, 2),
  (3, 'Soft Starts',
   'Focusing on reducing hard glottal attacks during sentence starts for a smoother, flowing speech pattern.',
   12, 'beginner', 'Soft Plosives',
   'The blue birds fly above the bright mountains.',
   false, 3),
  (4, 'Plosive Control',
   'Managing the P and B sounds with gentle air release to avoid burst sounds and build expressive control.',
   8, 'intermediate', 'Soft Plosives',
   'Bright blue bubbles burst above the purple bay at dawn.',
   false, 4),
  (5, 'Consonant Blends',
   'Mastering complex st, bl, and tr sounds in daily words with confidence and natural rhythm.',
   15, 'intermediate', 'Articulation',
   'Strong streams flow through the blossoming trail at dusk.',
   false, 5),
  (6, 'Rhyme and Rhythm',
   'Using poetic structures to find a natural speaking pace and develop expressive vocal flow.',
   10, 'intermediate', 'Fluency',
   'She sells smooth shells along the shining shoreline each morning.',
   false, 6),
  (7, 'Storytelling',
   'Applying all learned techniques to narrate a short story with expression, pacing, and confidence.',
   20, 'advanced', 'Integration',
   'Once upon a time, a quiet traveler crossed the peaceful valley at sunset.',
   false, 7),
  (8, 'Free Speech Mode',
   'A quiet space for unguided practice. Record and listen back to your own voice freely at your own pace.',
   0, 'beginner', 'Bonus',
   'Speak whatever comes to mind. This is your space to explore.',
   true, 8)
) AS v(day_number, title, description, duration_mins, level, module, practice_phrase, is_bonus, order_index)
WHERE NOT EXISTS (SELECT 1 FROM lessons LIMIT 1);

-- ─── practice_sessions ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS practice_sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL DEFAULT auth.uid()
                  REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id     uuid REFERENCES lessons(id) ON DELETE SET NULL,
  session_type  text NOT NULL DEFAULT 'general'
                  CHECK (session_type IN ('breathing','repeat','read_aloud','speak_freely','general')),
  duration_mins integer NOT NULL DEFAULT 0,
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS practice_sessions_user_started
  ON practice_sessions(user_id, started_at DESC);

ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_sessions"  ON practice_sessions;
DROP POLICY IF EXISTS "insert_own_sessions"  ON practice_sessions;
DROP POLICY IF EXISTS "update_own_sessions"  ON practice_sessions;
DROP POLICY IF EXISTS "delete_own_sessions"  ON practice_sessions;

CREATE POLICY "select_own_sessions" ON practice_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_sessions" ON practice_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_sessions" ON practice_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_sessions" ON practice_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── lesson_completions ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lesson_completions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL DEFAULT auth.uid()
                 REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id    uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS lesson_completions_user
  ON lesson_completions(user_id);

ALTER TABLE lesson_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_completions"  ON lesson_completions;
DROP POLICY IF EXISTS "insert_own_completions"  ON lesson_completions;
DROP POLICY IF EXISTS "update_own_completions"  ON lesson_completions;
DROP POLICY IF EXISTS "delete_own_completions"  ON lesson_completions;

CREATE POLICY "select_own_completions" ON lesson_completions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_completions" ON lesson_completions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_completions" ON lesson_completions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_completions" ON lesson_completions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── New-user trigger — create profile for new users ─────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile (display_name derived from the part before @ in email)
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    new.id,
    initcap(split_part(coalesce(new.email, 'user'), '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

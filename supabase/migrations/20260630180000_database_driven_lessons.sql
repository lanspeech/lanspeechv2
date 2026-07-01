-- Move LanSpeech course content into Supabase as the source of truth.

CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  theme text NOT NULL,
  goal text NOT NULL,
  description text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'units_slug_key'
  ) THEN
    ALTER TABLE public.units ADD CONSTRAINT units_slug_key UNIQUE (slug);
  END IF;
END $$;

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_units" ON public.units;
CREATE POLICY "anon_select_units" ON public.units FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_units" ON public.units;
CREATE POLICY "admin_insert_units" ON public.units FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_units" ON public.units;
CREATE POLICY "admin_update_units" ON public.units FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_units" ON public.units;
CREATE POLICY "admin_delete_units" ON public.units FOR DELETE
  TO authenticated USING (public.is_admin());

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS coach_tip text,
  ADD COLUMN IF NOT EXISTS reflection_prompt text,
  ADD COLUMN IF NOT EXISTS exercises jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lessons_slug_key'
  ) THEN
    ALTER TABLE public.lessons ADD CONSTRAINT lessons_slug_key UNIQUE (slug);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND is_admin = true
  );
$$;

DROP POLICY IF EXISTS "admin_insert_lessons" ON public.lessons;
CREATE POLICY "admin_insert_lessons" ON public.lessons FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_update_lessons" ON public.lessons;
CREATE POLICY "admin_update_lessons" ON public.lessons FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "admin_delete_lessons" ON public.lessons;
CREATE POLICY "admin_delete_lessons" ON public.lessons FOR DELETE
  TO authenticated USING (public.is_admin());

INSERT INTO public.units (slug, title, theme, goal, description, order_index)
VALUES
  (
    'unit-1',
    'Unit 1',
    'Awareness & Relaxed Breathing',
    'Learn to stay calm before speaking and build confidence using slow, relaxed speech.',
    'A gentle first week designed like a real speech-therapy starter sequence.',
    1
  ),
  (
    'unit-2',
    'Unit 2',
    'Gentle Voice',
    'Learn to begin speaking with a relaxed voice instead of forcing words out.',
    'Start voice onset gently, keep breathing while speaking, and build confidence through everyday greetings.',
    2
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  theme = EXCLUDED.theme,
  goal = EXCLUDED.goal,
  description = EXCLUDED.description,
  order_index = EXCLUDED.order_index,
  updated_at = now();

INSERT INTO public.lessons (
  slug, unit_id, day_number, title, description, duration_mins, level, module,
  practice_phrase, is_bonus, order_index, goal, coach_tip, reflection_prompt, exercises
)
SELECT
  'unit-1-lesson-1',
  u.id,
  1,
  'Lesson 1 - Welcome to LanSpeech',
  'Build calm breathing, simple repetition, gentle reading, and mirror speaking.',
  12,
  'beginner',
  u.title,
  'Breathe in slowly and let the breath soften your body.',
  false,
  1,
  'Learn how relaxed breathing supports easier speech.',
  null,
  'How relaxed did you feel today? Rate yourself from 1 to 5.',
  $$[
    {"id":"u1-l1-1","title":"Belly Breathing","kind":"breathing","description":"Use your breath to settle your body before speaking.","instructions":["Sit comfortably.","Place one hand on your chest and one on your stomach.","Breathe in through your nose for 4 seconds.","Feel only your stomach rise.","Breathe out slowly through your mouth for 6 seconds.","Relax your shoulders."],"repeatCount":10,"speakText":"Breathe in slowly and let the breath soften your body."},
    {"id":"u1-l1-2","title":"Repeat After Me","kind":"repeat","description":"Speak slowly and pause briefly between words.","phrases":["Hello","Welcome","Happy","Family","Friend","Water","Today","Beautiful","Morning","Thank you"],"repeatCount":5,"speakText":"Hello. Welcome. Happy. Family. Friend. Water. Today. Beautiful. Morning. Thank you."},
    {"id":"u1-l1-3","title":"Reading","kind":"reading","description":"Read the passage three times with a calm pace.","readText":"Hello. My name is Daniel. Today is a beautiful day. I enjoy talking with people. Every day I become more confident. I take my time when I speak. My voice deserves to be heard.","durationHint":"Read three times","speakText":"Hello. My name is Daniel. Today is a beautiful day."},
    {"id":"u1-l1-4","title":"Conversation Challenge","kind":"conversation","description":"Stand in front of a mirror and answer slowly.","prompt":"What is your name? Where do you live? What is one thing you enjoy doing?","durationHint":"Try speaking for one minute.","speakText":"My name is Daniel. I live in a quiet neighborhood. I enjoy walking and reading."}
  ]$$::jsonb
FROM public.units u
WHERE u.slug = 'unit-1'
ON CONFLICT (slug) DO UPDATE SET
  unit_id = EXCLUDED.unit_id,
  day_number = EXCLUDED.day_number,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_mins = EXCLUDED.duration_mins,
  level = EXCLUDED.level,
  module = EXCLUDED.module,
  practice_phrase = EXCLUDED.practice_phrase,
  is_bonus = EXCLUDED.is_bonus,
  order_index = EXCLUDED.order_index,
  goal = EXCLUDED.goal,
  coach_tip = EXCLUDED.coach_tip,
  reflection_prompt = EXCLUDED.reflection_prompt,
  exercises = EXCLUDED.exercises,
  updated_at = now();

INSERT INTO public.lessons (
  slug, unit_id, day_number, title, description, duration_mins, level, module,
  practice_phrase, is_bonus, order_index, goal, coach_tip, reflection_prompt, exercises
)
SELECT
  'unit-1-lesson-2',
  u.id,
  2,
  'Lesson 2 - Speaking Slowly',
  'Practice softer breathing, calm repetition, and steady pacing.',
  12,
  'beginner',
  u.title,
  'Slow breath in, pause, slow breath out.',
  false,
  2,
  'Learn that slowing down makes speech feel more controlled.',
  null,
  'Did slowing down make speaking easier?',
  $$[
    {"id":"u1-l2-1","title":"Slow Breathing","kind":"breathing","description":"Use a calm rhythm to build a steadier speaking pace.","instructions":["Breathe in for 4 seconds.","Pause for 2 seconds.","Breathe out for 6 seconds."],"repeatCount":10,"speakText":"Slow breath in, pause, slow breath out."},
    {"id":"u1-l2-2","title":"Repeat After Me","kind":"repeat","description":"Repeat each sentence slowly and gently.","phrases":["Good morning.","How are you?","My name is John.","Thank you.","I am happy today."],"repeatCount":5,"speakText":"Good morning. How are you? My name is John."},
    {"id":"u1-l2-3","title":"Reading","kind":"reading","description":"Read the passage slowly and let each phrase land.","readText":"I enjoy learning new things. Every day I become a better communicator. Speaking slowly helps me stay relaxed. I focus on sharing my ideas instead of rushing my words.","durationHint":"Read three times","speakText":"I enjoy learning new things. Every day I become a better communicator."},
    {"id":"u1-l2-4","title":"Conversation Challenge","kind":"conversation","description":"Answer aloud and keep your pacing calm.","prompt":"What did you eat today? What is your favorite food? What is your favorite color?","durationHint":"Speak for 90 seconds.","speakText":"Today I ate soup and toast. My favorite food is pasta. My favorite color is blue."}
  ]$$::jsonb
FROM public.units u
WHERE u.slug = 'unit-1'
ON CONFLICT (slug) DO UPDATE SET
  unit_id = EXCLUDED.unit_id,
  day_number = EXCLUDED.day_number,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_mins = EXCLUDED.duration_mins,
  level = EXCLUDED.level,
  module = EXCLUDED.module,
  practice_phrase = EXCLUDED.practice_phrase,
  is_bonus = EXCLUDED.is_bonus,
  order_index = EXCLUDED.order_index,
  goal = EXCLUDED.goal,
  coach_tip = EXCLUDED.coach_tip,
  reflection_prompt = EXCLUDED.reflection_prompt,
  exercises = EXCLUDED.exercises,
  updated_at = now();

INSERT INTO public.lessons (
  slug, unit_id, day_number, title, description, duration_mins, level, module,
  practice_phrase, is_bonus, order_index, goal, coach_tip, reflection_prompt, exercises
)
SELECT
  'unit-1-lesson-3',
  u.id,
  3,
  'Lesson 3 - Calm Conversations',
  'Practice soft voice starts, calm repetition, and short conversation flow.',
  12,
  'beginner',
  u.title,
  'Ahhhhhhhhh. Hello.',
  false,
  3,
  'Use breathing before speaking.',
  null,
  'How did breathing before speech change the way you spoke today?',
  $$[
    {"id":"u1-l3-1","title":"Speak on Exhale","kind":"breathing","description":"Begin your words on a slow exhale to reduce tension.","instructions":["Take a deep belly breath.","Exhale slowly.","While exhaling, say: Ahhhhhhhhh.","Then say: Hello."],"repeatCount":10,"speakText":"Ahhhhhhhhh. Hello."},
    {"id":"u1-l3-2","title":"Repeat After Me","kind":"repeat","description":"Repeat each sentence slowly and keep your jaw loose.","phrases":["Today is a good day.","I enjoy talking with people.","I take my time when I speak.","My ideas are important.","I am becoming more confident every day."],"repeatCount":5,"speakText":"Today is a good day. I enjoy talking with people."},
    {"id":"u1-l3-3","title":"Reading","kind":"reading","description":"Read the passage three times with gentle pacing.","readText":"Confidence grows with practice. Every conversation is an opportunity to learn. I do not need perfect speech. I only need to communicate. Every small improvement matters.","durationHint":"Read three times","speakText":"Confidence grows with practice. Every conversation is an opportunity to learn."},
    {"id":"u1-l3-4","title":"Conversation Challenge","kind":"conversation","description":"Talk about your family for two minutes using a calm pace.","prompt":"Tell me about your family. Take a breath before each sentence, slow down, and smile.","durationHint":"Speak for two minutes.","speakText":"My family is very important to me. We spend time together and support each other."}
  ]$$::jsonb
FROM public.units u
WHERE u.slug = 'unit-1'
ON CONFLICT (slug) DO UPDATE SET
  unit_id = EXCLUDED.unit_id,
  day_number = EXCLUDED.day_number,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_mins = EXCLUDED.duration_mins,
  level = EXCLUDED.level,
  module = EXCLUDED.module,
  practice_phrase = EXCLUDED.practice_phrase,
  is_bonus = EXCLUDED.is_bonus,
  order_index = EXCLUDED.order_index,
  goal = EXCLUDED.goal,
  coach_tip = EXCLUDED.coach_tip,
  reflection_prompt = EXCLUDED.reflection_prompt,
  exercises = EXCLUDED.exercises,
  updated_at = now();

INSERT INTO public.lessons (
  slug, unit_id, day_number, title, description, duration_mins, level, module,
  practice_phrase, is_bonus, order_index, goal, coach_tip, reflection_prompt, exercises
)
SELECT
  'unit-2-lesson-1',
  u.id,
  4,
  'Lesson 4 - Starting Your Voice Gently',
  'Begin speech gently, keep the breath calm, and reduce tension at word beginnings.',
  12,
  'beginner',
  u.title,
  'Ahhhhhhhhh',
  false,
  4,
  'Learn how to start speaking with a soft, relaxed voice.',
  'Many people who stutter try to force words out. Instead of pushing, imagine your voice gently riding on your breath.',
  'Did beginning your words gently feel easier today? Rate the ease from 1 to 5.',
  $$[
    {"id":"u2-l1-1","title":"Breathing with Voice","kind":"breathing","description":"Breathe in slowly and let your voice float out with the breath.","instructions":["Sit comfortably.","Breathe in through your nose for four seconds.","As you breathe out, gently say: Ahhhhhhhhh.","Imagine your voice floating out with your breath.","Do not push your voice."],"repeatCount":10,"speakText":"Ahhhhhhhhh"},
    {"id":"u2-l1-2","title":"Repeat After Me","kind":"repeat","description":"Start each word softly and linger on the first sound.","phrases":["Hello","Apple","Open","Always","Everyone","Amazing","Afternoon","Orange","Easy","Okay"],"repeatCount":5,"speakText":"Hello. Apple. Open. Always. Everyone. Amazing. Afternoon. Orange. Easy. Okay."},
    {"id":"u2-l1-3","title":"Reading","kind":"reading","description":"Read the passage three times with calm breathing before every sentence.","readText":"Every morning brings a new opportunity. I begin my day with calm breathing and a relaxed voice. I do not rush my words. Speaking gently helps me communicate with confidence and ease.","durationHint":"Read three times. Take one gentle breath before every sentence.","speakText":"Every morning brings a new opportunity. I begin my day with calm breathing and a relaxed voice."},
    {"id":"u2-l1-4","title":"Conversation Challenge","kind":"conversation","description":"Answer the questions aloud with a relaxed breath before each answer.","prompt":"What is your name? Where are you from? What do you enjoy doing?","durationHint":"Speak for 90 seconds.","speakText":"My name is Daniel. I am from a calm city. I enjoy walking and reading."}
  ]$$::jsonb
FROM public.units u
WHERE u.slug = 'unit-2'
ON CONFLICT (slug) DO UPDATE SET
  unit_id = EXCLUDED.unit_id,
  day_number = EXCLUDED.day_number,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_mins = EXCLUDED.duration_mins,
  level = EXCLUDED.level,
  module = EXCLUDED.module,
  practice_phrase = EXCLUDED.practice_phrase,
  is_bonus = EXCLUDED.is_bonus,
  order_index = EXCLUDED.order_index,
  goal = EXCLUDED.goal,
  coach_tip = EXCLUDED.coach_tip,
  reflection_prompt = EXCLUDED.reflection_prompt,
  exercises = EXCLUDED.exercises,
  updated_at = now();

INSERT INTO public.lessons (
  slug, unit_id, day_number, title, description, duration_mins, level, module,
  practice_phrase, is_bonus, order_index, goal, coach_tip, reflection_prompt, exercises
)
SELECT
  'unit-2-lesson-2',
  u.id,
  5,
  'Lesson 5 - Everyday Greetings',
  'Use calm breathing and soft beginnings to make everyday greetings feel easier.',
  12,
  'beginner',
  u.title,
  'Breathe in slowly. Breathe out with a calm count.',
  false,
  5,
  'Practice using gentle voice onset during common greetings.',
  'A calm breath before a greeting helps your voice begin softly. Focus on relaxed starts more than perfect words.',
  'Which greeting felt the easiest to say today?',
  $$[
    {"id":"u2-l2-1","title":"Calm Breathing","kind":"breathing","description":"Count slowly as you breathe out to keep your voice steady.","instructions":["Breathe in for four seconds.","Breathe out while counting slowly: One, Two, Three, Four, Five."],"repeatCount":10,"speakText":"Breathe in slowly. Breathe out with a calm count."},
    {"id":"u2-l2-2","title":"Repeat After Me","kind":"repeat","description":"Say each greeting with a soft beginning before the sentence.","phrases":["Good morning.","Good afternoon.","Good evening.","Nice to meet you.","How are you today?","It's great to see you.","Thank you very much.","Have a wonderful day.","Welcome.","See you later."],"repeatCount":5,"speakText":"Good morning. Good afternoon. Good evening. Nice to meet you. How are you today? It is great to see you."},
    {"id":"u2-l2-3","title":"Reading","kind":"reading","description":"Read the greeting passage three times and imagine greeting a real person.","readText":"Greetings are often the first words we speak each day. A calm breath before speaking allows our voice to begin gently. Every greeting is an opportunity to practice relaxed communication.","durationHint":"Read three times. Imagine greeting a real person.","speakText":"Greetings are often the first words we speak each day. A calm breath before speaking allows our voice to begin gently."},
    {"id":"u2-l2-4","title":"Conversation Challenge","kind":"conversation","description":"Answer as if meeting a new colleague, using calm breathing and gentle starts.","prompt":"What is your name? What do you do? What are your hobbies?","durationHint":"Speak for two minutes. If you get stuck, pause, breathe, and continue naturally.","speakText":"My name is Daniel. I work with people to help them practice confidence. I enjoy reading and walking."}
  ]$$::jsonb
FROM public.units u
WHERE u.slug = 'unit-2'
ON CONFLICT (slug) DO UPDATE SET
  unit_id = EXCLUDED.unit_id,
  day_number = EXCLUDED.day_number,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_mins = EXCLUDED.duration_mins,
  level = EXCLUDED.level,
  module = EXCLUDED.module,
  practice_phrase = EXCLUDED.practice_phrase,
  is_bonus = EXCLUDED.is_bonus,
  order_index = EXCLUDED.order_index,
  goal = EXCLUDED.goal,
  coach_tip = EXCLUDED.coach_tip,
  reflection_prompt = EXCLUDED.reflection_prompt,
  exercises = EXCLUDED.exercises,
  updated_at = now();

INSERT INTO public.lessons (
  slug, unit_id, day_number, title, description, duration_mins, level, module,
  practice_phrase, is_bonus, order_index, goal, coach_tip, reflection_prompt, exercises
)
SELECT
  'unit-2-lesson-3',
  u.id,
  6,
  'Lesson 6 - Speaking with Confidence',
  'Move from warm-up breathing and soft starts into a longer, confident self-introduction.',
  14,
  'beginner',
  u.title,
  'Hello. My name is Daniel.',
  false,
  6,
  'Combine relaxed breathing, gentle voice onset, and slow speech in one conversation.',
  'Communication is about sharing ideas, not perfect speech. Keep breathing slowly and start words gently.',
  'Did beginning your sentences gently help you feel more confident today?',
  $$[
    {"id":"u2-l3-1","title":"Relax, Breathe, Speak","kind":"breathing","description":"Relax your body, breathe deeply, and say the soft phrase slowly.","instructions":["Relax your shoulders.","Take one deep belly breath.","Smile.","Say softly: Hello.","Take another breath.","Then say: My name is...","Complete the sentence using your own name."],"repeatCount":10,"speakText":"Hello. My name is Daniel."},
    {"id":"u2-l3-2","title":"Repeat After Me","kind":"repeat","description":"Speak each sentence slowly and gently while keeping your voice calm.","phrases":["I enjoy learning new things.","My voice deserves to be heard.","I can take my time when I speak.","Every conversation helps me improve.","Speaking calmly gives me confidence.","I am proud of my progress.","My ideas are valuable.","I communicate with courage every day.","I choose calm over rushing.","I believe in myself."],"repeatCount":3,"speakText":"I enjoy learning new things. My voice deserves to be heard. I can take my time when I speak."},
    {"id":"u2-l3-3","title":"Reading","kind":"reading","description":"Read the passage three times with a relaxed speech pace.","readText":"Communication is about sharing ideas, not speaking perfectly. Every conversation helps us grow. When we breathe calmly and begin our voice gently, speaking becomes easier. Progress happens one conversation at a time.","durationHint":"Read three times. Imagine you are giving a short speech to a friend.","speakText":"Communication is about sharing ideas, not speaking perfectly. Every conversation helps us grow."},
    {"id":"u2-l3-4","title":"Conversation Challenge","kind":"conversation","description":"Speak for three minutes about yourself with gentle starts and steady pacing.","prompt":"Where did you grow up? What do you enjoy doing? What is one goal you hope to achieve this year? What makes you happy?","durationHint":"Speak for three minutes. Keep talking even if you stutter.","speakText":"I grew up in a quiet town. I enjoy reading and spending time outdoors."}
  ]$$::jsonb
FROM public.units u
WHERE u.slug = 'unit-2'
ON CONFLICT (slug) DO UPDATE SET
  unit_id = EXCLUDED.unit_id,
  day_number = EXCLUDED.day_number,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  duration_mins = EXCLUDED.duration_mins,
  level = EXCLUDED.level,
  module = EXCLUDED.module,
  practice_phrase = EXCLUDED.practice_phrase,
  is_bonus = EXCLUDED.is_bonus,
  order_index = EXCLUDED.order_index,
  goal = EXCLUDED.goal,
  coach_tip = EXCLUDED.coach_tip,
  reflection_prompt = EXCLUDED.reflection_prompt,
  exercises = EXCLUDED.exercises,
  updated_at = now();

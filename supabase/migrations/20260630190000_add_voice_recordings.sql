CREATE TABLE IF NOT EXISTS public.voice_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id text,
  exercise_id text,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL DEFAULT 'audio/webm',
  file_size_bytes integer NOT NULL DEFAULT 0,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS voice_recordings_user_uploaded
  ON public.voice_recordings(user_id, uploaded_at DESC);

ALTER TABLE public.voice_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_voice_recordings" ON public.voice_recordings;
DROP POLICY IF EXISTS "insert_own_voice_recordings" ON public.voice_recordings;
DROP POLICY IF EXISTS "update_own_voice_recordings" ON public.voice_recordings;
DROP POLICY IF EXISTS "delete_own_voice_recordings" ON public.voice_recordings;

CREATE POLICY "select_own_voice_recordings" ON public.voice_recordings
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "insert_own_voice_recordings" ON public.voice_recordings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "update_own_voice_recordings" ON public.voice_recordings
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete_own_voice_recordings" ON public.voice_recordings
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.voice_recordings OWNER TO postgres;

-- Ensure uploads to the 'recordings' bucket are allowed only into the user's folder
-- and allow authenticated users to insert/read their metadata rows.

-- 1) Storage policy: allow authenticated users to insert into storage.objects when
-- the bucket matches and the path belongs to auth.uid()

DROP POLICY IF EXISTS allow_authenticated_uploads_to_recordings ON storage.objects;
CREATE POLICY allow_authenticated_uploads_to_recordings
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'recordings'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS allow_select_recordings_storage_objects_for_user ON storage.objects;
CREATE POLICY allow_select_recordings_storage_objects_for_user
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'recordings' AND split_part(name, '/', 1) = auth.uid()::text
  );

-- 2) Make sure voice_recordings.user_id defaults to auth.uid()
ALTER TABLE IF EXISTS public.voice_recordings
  ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3) Voice recordings table policies: allow users to insert rows for themselves
DROP POLICY IF EXISTS insert_own_voice_recordings ON public.voice_recordings;
CREATE POLICY insert_own_voice_recordings ON public.voice_recordings
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS select_own_voice_recordings ON public.voice_recordings;
CREATE POLICY select_own_voice_recordings ON public.voice_recordings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS update_own_voice_recordings ON public.voice_recordings;
CREATE POLICY update_own_voice_recordings ON public.voice_recordings
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS delete_own_voice_recordings ON public.voice_recordings;
CREATE POLICY delete_own_voice_recordings ON public.voice_recordings
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());


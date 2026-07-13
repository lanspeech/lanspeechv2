import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface UseMicrophoneRecordingOptions {
  lessonId?: string;
  exerciseId?: string;
  userId?: string | null;
}

interface UseMicrophoneRecordingResult {
  recording: boolean;
  audioUrl: string | null;
  audioBlob: Blob | null;
  recordingSaved: boolean;
  loading: boolean;
  error: string | null;
  lastUploadResult: unknown | null;
  lastInsertResult: unknown | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  clearRecording: () => Promise<void>;
}

export function useMicrophoneRecording(options: UseMicrophoneRecordingOptions = {}): UseMicrophoneRecordingResult {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingSaved, setRecordingSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUploadResult, setLastUploadResult] = useState<unknown>(null);
  const [lastInsertResult, setLastInsertResult] = useState<unknown>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
  }, []);

  const uploadRecording = async (blob: Blob) => {
    // Prefer explicit user fetch to avoid session shape differences across supabase versions
    const { data: userData } = await supabase.auth.getUser();
    const currentUser = userData?.user ?? null;

    if (!currentUser) {
      throw new Error('You must be signed in to save a recording.');
    }

    const bucket = 'recordings';
    const fileName = `recording-${Date.now()}-${Math.random().toString(36).slice(2)}.webm`;
    const storagePath = `${currentUser.id}/${options.lessonId ? `lesson_${options.lessonId}` : 'lesson'}/${options.exerciseId ? `exercise_${options.exerciseId}` : 'exercise'}/${fileName}`;

    const uploadRes = await supabase.storage.from(bucket).upload(storagePath, blob, {
      contentType: blob.type || 'audio/webm',
      upsert: false,
      cacheControl: '3600',
    });

    setLastUploadResult(uploadRes);

    if (uploadRes.error) {
      console.error('storage upload error response:', uploadRes);
      // include context to help debug RLS failures
      console.error('upload context:', {
        userId: currentUser.id,
        storagePath,
        bucket,
      });
      const errMsg = uploadRes.error.message || JSON.stringify(uploadRes.error);
      throw new Error(`Storage upload failed: ${errMsg}`);
    }

    const insertRes = await supabase.from('voice_recordings').insert({
      user_id: currentUser.id,
      lesson_id: options.lessonId ?? null,
      exercise_id: options.exerciseId ?? null,
      storage_bucket: bucket,
      storage_path: storagePath,
      file_name: fileName,
      mime_type: blob.type || 'audio/webm',
      file_size_bytes: blob.size,
      metadata: {
        source: 'lesson-recording',
      },
    });

    setLastInsertResult(insertRes);

    if (insertRes.error) {
      console.error('db insert error response:', insertRes);
      throw insertRes.error;
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingSaved(false);
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => setRecording(true);
      mediaRecorder.onstop = () => setRecording(false);

      mediaRecorderRef.current = mediaRecorder;
      // Start recording with 1000ms timeslice to ensure ondataavailable fires regularly
      mediaRecorder.start(1000);
      console.log('Recording started with stream:', stream.getAudioTracks().length, 'audio track(s)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Recording error:', err);
      setError(`Microphone access denied: ${errorMessage}`);
      setRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        setRecording(false);
        const completedBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        
        // Log blob size and chunk count for debugging
        console.log('Recording stopped. Blob size:', completedBlob.size, 'bytes, chunks:', audioChunksRef.current.length);
        
        if (completedBlob.size === 0) {
          console.warn('Warning: Recording blob is empty! This may indicate no audio was captured.');
        }
        
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
        }

        const newObjectUrl = URL.createObjectURL(completedBlob);
        objectUrlRef.current = newObjectUrl;
        setAudioBlob(completedBlob);
        setAudioUrl(newObjectUrl);
        setRecordingSaved(false);

          setLoading(true);
          try {
            await uploadRecording(completedBlob);
            setRecordingSaved(true);
            setError(null);
          } catch (err) {
            const message = err instanceof Error
              ? err.message
              : typeof err === 'object' && err !== null
                ? JSON.stringify(err)
                : String(err);
            setError(`Upload failed: ${message}`);
            console.error('uploadRecording error:', err);
          } finally {
            setLoading(false);
            resolve();
          }
      };

      mediaRecorder.stop();
      mediaRecorderRef.current = null;
    });
  };

  const clearRecording = async () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      mediaRecorderRef.current = null;
    }

    audioChunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingSaved(false);
    setError(null);
    setLoading(false);
  };

  return {
    recording,
    audioUrl,
    audioBlob,
    recordingSaved,
    loading,
    error,
    // expose raw responses for debugging
    lastUploadResult: lastUploadResult ?? null,
    lastInsertResult: lastInsertResult ?? null,
    startRecording,
    stopRecording,
    clearRecording,
  };
}

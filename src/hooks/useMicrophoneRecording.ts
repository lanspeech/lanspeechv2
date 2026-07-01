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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
  }, []);

  const uploadRecording = async (blob: Blob) => {
    const { data: { session } } = await supabase.auth.getSession();
    const currentUser = session?.user;

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
      mediaRecorder.start();
    } catch {
      setError('Microphone access denied');
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
              // surface detailed Supabase errors for debugging RLS failures
              if (err && typeof err === 'object') {
                try {
                  // @ts-ignore
                  const msg = err.message || JSON.stringify(err);
                  setError(`Upload failed: ${msg}`);
                  console.error('uploadRecording error:', err);
                } catch (e) {
                  setError('Recording upload failed');
                }
              } else {
                setError(err instanceof Error ? err.message : 'Recording upload failed');
              }
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
    startRecording,
    stopRecording,
    clearRecording,
  };
}

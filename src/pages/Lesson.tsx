import { X, Play, Lightbulb, Shield, Volume2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Button from '../components/ui/Button';
import type { Lesson as LessonType, PracticeSession } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { computeStats } from '../lib/stats';
import { useMicrophoneRecording } from '../hooks/useMicrophoneRecording';
import { fetchLessons, fetchUnitLessons } from '../lib/lessons';

interface Props {
  lesson: LessonType | null;
  onClose: () => void;
  onComplete: (durationMins: number) => void;
  onAdvance: (durationMins: number) => void;
}

const TIPS = [
  'Take a deep breath before you start. It is okay to pause between words.',
  'Speak at a comfortable pace — clarity matters more than speed.',
  'If you stumble, that is perfectly fine. Simply restart the phrase.',
  'Your practice is for stammerers — every gentle attempt is progress.',
  'Relax your jaw and lips before each attempt. You are doing great!',
];

function useSpeech(phrase: string) {
  const [speaking, setSpeaking] = useState(false);

  const speak = () => {
    if (!('speechSynthesis' in window)) {
      console.error('Speech Synthesis API not available');
      return;
    }
    
    if (!phrase) {
      console.warn('useSpeech: No phrase provided to speak', { phrase });
      return;
    }
    
    try {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(phrase);
      utt.rate = 0.82;
      utt.pitch = 1.0;
      utt.lang = 'en-US';
      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(v => v.lang === 'en-US' && /samantha|karen|daniel/i.test(v.name)) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
      if (preferred) utt.voice = preferred;
      utt.onstart = () => setSpeaking(true);
      utt.onend = () => setSpeaking(false);
      utt.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setSpeaking(false);
      };
      window.speechSynthesis.speak(utt);
      console.log('Speaking:', phrase.substring(0, 50) + '...');
    } catch (error) {
      console.error('Error in speak():', error);
      setSpeaking(false);
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  return { speaking, speak, stop };
}

export default function Lesson({ lesson, onClose, onComplete, onAdvance }: Props) {
  const { user, profile } = useAuth();
  const sessionStart = useRef(Date.now());
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [justDone, setJustDone] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [lessonCount, setLessonCount] = useState(3);
  const [isFinalUnitLesson, setIsFinalUnitLesson] = useState(false);
  const exercises = lesson?.exercises ?? [];
  const defaultExercise = {
    id: 'general-practice',
    title: lesson ? 'Warm-up' : 'General Practice',
    description: lesson
      ? 'Follow the steps slowly and stay relaxed.'
      : 'Record a short practice to build confidence in your own voice.',
    speakText: lesson?.practice_phrase ?? 'Take a deep breath and speak when you are ready.',
  };
  const currentExercise = exercises[activeExerciseIndex] ?? defaultExercise;
  const { speaking, speak, stop } = useSpeech(currentExercise.speakText ?? '');
  const { recording, audioUrl, recordingSaved, loading, error, startRecording, stopRecording, clearRecording } = useMicrophoneRecording({
    lessonId: lesson?.id,
    exerciseId: currentExercise.id,
    userId: user?.id,
  });
  const progressStorageKey = lesson ? `lesson-progress-${lesson.id}` : null;

  useEffect(() => {
    if (!lesson) return;
    const saved = progressStorageKey ? localStorage.getItem(progressStorageKey) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { lessonId: string; exerciseIndex: number };
        if (parsed.lessonId === lesson.id && Number.isFinite(parsed.exerciseIndex)) {
          setActiveExerciseIndex(Math.min(Math.max(0, parsed.exerciseIndex), exercises.length - 1));
        }
      } catch {
        // ignore invalid progress data
      }
    } else {
      setActiveExerciseIndex(0);
    }
    sessionStart.current = Date.now();
  }, [lesson, progressStorageKey, exercises.length]);

  useEffect(() => {
    if (!lesson || progressStorageKey == null) return;
    localStorage.setItem(
      progressStorageKey,
      JSON.stringify({ lessonId: lesson.id, exerciseIndex: activeExerciseIndex, updatedAt: new Date().toISOString() })
    );
  }, [lesson, progressStorageKey, activeExerciseIndex]);

  useEffect(() => {
    if (!user || !profile) return;
    const loadLessonStats = async () => {
      const [{ data: sessions }, { data: completions }, lessons] = await Promise.all([
        supabase.from('practice_sessions').select('*').eq('user_id', user.id),
        supabase.from('lesson_completions').select('lesson_id').eq('user_id', user.id),
        fetchLessons(),
      ]);

      const lessonIds = new Set(lessons.map(item => item.id));
      const completedCount = (completions ?? []).filter(item => lessonIds.has(item.lesson_id)).length;
      setLessonCount(lessons.length || 1);
      const stats = computeStats((sessions ?? []) as PracticeSession[], completedCount, profile.daily_goal_mins);
      setCurrentStreak(stats.currentStreak);
    };
    loadLessonStats();
  }, [user, profile]);

  useEffect(() => {
    if (!lesson?.unit_id) {
      setIsFinalUnitLesson(true);
      return;
    }

    fetchUnitLessons(lesson.unit_id)
      .then(unitLessons => {
        setIsFinalUnitLesson(unitLessons[unitLessons.length - 1]?.id === lesson.id);
      })
      .catch(() => setIsFinalUnitLesson(false));
  }, [lesson]);

  useEffect(() => {
    stop();
  }, [activeExerciseIndex, stop]);

  useEffect(() => {
    // Ensure speech synthesis voices are loaded
    const loadVoices = () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        console.log('Speech synthesis voices loaded');
      }
    };
    
    // Some browsers require listening to the voiceschanged event
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    }
    
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const clearSavedProgress = () => {
    if (progressStorageKey) {
      localStorage.removeItem(progressStorageKey);
    }
  };

  const handleClose = async () => {
    if (recording) {
      await stopRecording();
    }
    clearSavedProgress();
    window.speechSynthesis.cancel();
    onClose();
  };

  const handlePlay = () => {
    console.log('Play button clicked. Speaking state:', speaking, 'Current exercise:', currentExercise);
    if (speaking) {
      stop();
    } else {
      speak();
    }
  };

  const playRecordedAudio = () => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audio.play().catch(() => undefined);
  };

  const handleContinue = async () => {
    await clearRecording();
    if (activeExerciseIndex < exercises.length - 1) {
      setActiveExerciseIndex(i => i + 1);
    } else {
      handleDone();
    }
  };

  const handleDone = () => {
    clearSavedProgress();
    setJustDone(true);
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const mins = Math.max(1, Math.round((Date.now() - sessionStart.current) / 60000));
      onComplete(mins);
    }, 300);
  };

  const lessonCompleteReady = recordingSaved && activeExerciseIndex >= exercises.length - 1;
  const lessonProgressPct = lesson ? Math.min(100, Math.round(((lesson.order_index ?? lesson.day_number) / lessonCount) * 100)) : 0;

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col transition-opacity duration-300 ${justDone ? 'opacity-0' : 'opacity-100'}`}>
      <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 animate-fade-in">
        <button onClick={() => { void handleClose(); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 hover:scale-110 active:scale-90 transition-all duration-150">
          <X size={18} className="text-gray-500" />
        </button>
        <div className="flex-shrink-0">
          <p className="font-bold text-emerald-700 text-base leading-tight">{lesson?.title ?? 'Practice Session'}</p>
          <p className="text-xs text-gray-500">{lesson?.unit_title ?? lesson?.module ?? 'Unit 1'}</p>
          <p className="text-xs text-gray-500 mt-1">This lesson is designed for stammerers: take your time and use each pause as a reset.</p>
        </div>
        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-gray-500 whitespace-nowrap">Lesson Progress</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div className="bg-emerald-700 h-2 rounded-full transition-all duration-500 ease-out" style={{ width: `${lessonProgressPct}%` }} />
          </div>
          <span className="text-sm font-semibold text-gray-700 tabular-nums">{lessonProgressPct}%</span>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 ml-2">
          <span className="text-sm font-bold text-emerald-700">{currentStreak} days</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl bg-white rounded-3xl shadow-md p-8 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700 font-semibold">{lesson?.unit_title ?? 'Unit 1'}</p>
              <h2 className="text-2xl font-semibold text-gray-900 mt-1">{lesson?.goal ?? lesson?.description ?? 'Calm speaking practice'}</h2>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{activeExerciseIndex + 1}/{Math.max(1, exercises.length)}</div>
          </div>
          {lesson?.coachTip && (
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-gray-700">
              <p className="font-semibold text-emerald-700 mb-1">Coach&apos;s Tip</p>
              <p>{lesson.coachTip}</p>
            </div>
          )}

          {lesson?.techniqueReminders?.length ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={16} className="text-emerald-600" />
                <p className="text-sm font-semibold text-emerald-700">Technique reminder</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {lesson.techniqueReminders.map(reminder => (
                  <span key={reminder} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
                    {reminder}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 mb-6">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Exercise {activeExerciseIndex + 1}</p>
                <h3 className="text-xl font-semibold text-gray-900 mt-1">{currentExercise?.title ?? 'Warm-up'}</h3>
              </div>
              <button onClick={handlePlay} className="rounded-full bg-emerald-600 p-3 text-white shadow-sm">
                <Play size={16} fill="white" />
              </button>
            </div>
            <p className="text-sm text-gray-600">{currentExercise?.description ?? 'Follow the steps slowly and stay relaxed.'}</p>
          </div>

          <div className="rounded-2xl border border-gray-100 p-5 mb-6">
            {currentExercise?.kind === 'breathing' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">Instructions</p>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                  {currentExercise.instructions?.map(step => <li key={step}>{step}</li>)}
                </ul>
                {currentExercise.repeatCount && <p className="text-sm text-emerald-700 font-semibold">Repeat {currentExercise.repeatCount} times</p>}
              </div>
            )}

            {currentExercise?.kind === 'repeat' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">Repeat each phrase slowly</p>
                <div className="flex flex-wrap gap-2">
                  {currentExercise.phrases?.map(text => <span key={text} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-gray-700">{text}</span>)}
                </div>
                {currentExercise.repeatCount && <p className="text-sm text-emerald-700 font-semibold">Repeat each phrase {currentExercise.repeatCount} times</p>}
              </div>
            )}

            {currentExercise?.kind === 'reading' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">Read this passage</p>
                <blockquote className="rounded-2xl bg-slate-50 p-4 text-sm text-gray-700 leading-relaxed">{currentExercise.readText}</blockquote>
                {currentExercise.durationHint && <p className="text-sm text-emerald-700 font-semibold">{currentExercise.durationHint}</p>}
              </div>
            )}

            {currentExercise?.kind === 'conversation' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">Conversation challenge</p>
                <p className="text-sm text-gray-700 leading-relaxed">{currentExercise.prompt}</p>
                {currentExercise.durationHint && <p className="text-sm text-emerald-700 font-semibold">{currentExercise.durationHint}</p>}
              </div>
            )}

            {currentExercise?.kind === 'reflection' && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-800">Reflection</p>
                <p className="text-sm text-gray-700 leading-relaxed">{lesson?.reflection_prompt ?? currentExercise.description}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <Button variant="secondary" size="md" onClick={() => setActiveExerciseIndex(i => Math.max(0, i - 1))} className="flex items-center gap-2 border border-gray-200 text-gray-700">
              <ArrowLeft size={14} /> Previous
            </Button>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Volume2 size={12} />
              <span>{speaking ? 'Listening...' : 'Tap play to hear the cue'}</span>
            </div>
            <Button size="md" onClick={() => setActiveExerciseIndex(i => Math.min(exercises.length - 1, i + 1))} disabled={!recordingSaved || activeExerciseIndex >= exercises.length - 1} className={`${!recordingSaved || activeExerciseIndex >= exercises.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
              Next <ArrowRight size={14} />
            </Button>
          </div>

          <div className="flex gap-3 mb-4">
            <Button
              size="lg"
              onClick={() => {
                clearSavedProgress();
                const mins = Math.max(1, Math.round((Date.now() - sessionStart.current) / 60000));
                if (isFinalUnitLesson) {
                  handleDone();
                } else {
                  onAdvance(mins);
                }
              }}
              disabled={!lessonCompleteReady}
              className={`${!lessonCompleteReady ? 'opacity-50 cursor-not-allowed' : ''} flex-1`}
            >
              {isFinalUnitLesson ? 'Complete Lesson' : 'Finish Lesson'}
            </Button>
            <Button
              size="lg"
              onClick={async () => { if (recording) await stopRecording(); else await startRecording(); }}
              disabled={loading}
              className={`${recording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} ${loading ? 'opacity-60 cursor-not-allowed' : ''} flex-1`}
            >
              {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : recording ? 'Stop Recording' : 'Record Yourself'}
            </Button>
          </div>

          {recordingSaved && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 mb-4">
              <h4 className="text-sm font-semibold text-emerald-700">🎤 Recording saved</h4>
              <p className="text-sm text-gray-700 mt-2">
                Your voice recording has been saved. You can listen to it before continuing. Our human speech therapists will review your recording and provide personalized feedback.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button onClick={playRecordedAudio} size="md" className="bg-emerald-700 text-white">▶️ Listen</Button>
                <Button onClick={() => { void (async () => { await clearRecording(); await startRecording(); })(); }} disabled={loading} variant="secondary" size="md">🔁 Record Again</Button>
                <Button onClick={() => { void handleContinue(); }} disabled={loading || !recordingSaved} variant="secondary" size="md">Continue</Button>
              </div>
            </div>
          )}

          {error && <div className="rounded-2xl p-4 border bg-red-50 border-red-200 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>}

          <div className="mt-5 rounded-2xl bg-white border border-gray-100 p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Lightbulb size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-700 text-sm">Friendly reminder</p>
              <p className="text-sm text-gray-600 leading-relaxed">{TIPS[(activeExerciseIndex + currentStreak) % TIPS.length]}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 text-gray-400 text-xs">
            <div className="flex items-center gap-2">
              <Shield size={12} />
              <span>Session secure and private</span>
            </div>
            <div className="flex items-center gap-2">
              <Lightbulb size={12} />
              <span>Stammering is welcome here - every attempt is progress.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

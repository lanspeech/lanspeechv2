import { X, Play, Mic, Lightbulb, Shield, Flame, Volume2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import type { Lesson as LessonType } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  lesson: LessonType | null;
  onClose: () => void;
  onComplete: (durationMins: number) => void;
}

const DEFAULT_PHRASE = '"Take a deep breath and speak with confidence."';

const TIPS = [
  "Take a deep breath before you start. It's okay to pause between words.",
  'Speak at a comfortable pace — clarity matters more than speed.',
  'If you stumble, that\'s perfectly fine. Simply restart the phrase.',
  'Focus on smooth airflow. Let the words ride on your breath.',
  'Relax your jaw and lips before each attempt. You\'re doing great!',
];

function useSpeech(phrase: string) {
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(phrase.replace(/["""]/g, ''));
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
    utt.onerror = () => setSpeaking(false);
    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  useEffect(() => () => { window.speechSynthesis.cancel(); }, []);

  return { speaking, speak, stop };
}

export default function Lesson({ lesson, onClose, onComplete }: Props) {
  const { profile } = useAuth();
  const sessionStart = useRef(Date.now());
  const phrase = lesson?.practice_phrase ?? DEFAULT_PHRASE;
  const { speaking, speak, stop } = useSpeech(phrase);
  const [pitchH, setPitchH] = useState(40);
  const [clarityH, setClarityH] = useState(55);
  const [bar2H, setBar2H] = useState(25);
  const [bar4H, setBar4H] = useState(35);
  const [attempts, setAttempts] = useState(0);
  const [justDone, setJustDone] = useState(false);
  const tipIdx = attempts % TIPS.length;

  useEffect(() => {
    let id: ReturnType<typeof setInterval>;
    if (speaking) {
      id = setInterval(() => {
        setPitchH(25 + Math.random() * 55);
        setClarityH(30 + Math.random() * 50);
        setBar2H(15 + Math.random() * 40);
        setBar4H(20 + Math.random() * 45);
      }, 180);
    } else {
      setPitchH(40);
      setClarityH(55);
      setBar2H(25);
      setBar4H(35);
    }
    return () => clearInterval(id);
  }, [speaking]);

  const handlePlay = () => speaking ? stop() : speak();

  const handleDone = () => {
    setJustDone(true);
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const mins = Math.max(1, Math.round((Date.now() - sessionStart.current) / 60000));
      onComplete(mins);
    }, 300);
  };

  const handleTryAgain = () => {
    stop();
    setPitchH(40);
    setClarityH(55);
    setAttempts(a => a + 1);
  };

  const progressPct = Math.min(100, attempts * 20 + 20);
  const streak = profile?.daily_goal_mins ?? 0;

  return (
    <div className={`min-h-screen bg-slate-100 flex flex-col transition-opacity duration-300 ${justDone ? 'opacity-0' : 'opacity-100'}`}>
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center gap-6 animate-fade-in">
        <button
          onClick={() => { window.speechSynthesis.cancel(); onClose(); }}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 hover:scale-110 active:scale-90 transition-all duration-150"
        >
          <X size={18} className="text-gray-500" />
        </button>

        <div className="flex-shrink-0">
          <p className="font-bold text-emerald-700 text-base leading-tight">
            {lesson?.title ?? 'Practice Session'}
          </p>
          <p className="text-xs text-gray-500">{lesson?.module ?? 'Free Practice'}</p>
        </div>

        <div className="flex-1 flex items-center gap-3">
          <span className="text-xs text-gray-500 whitespace-nowrap">Lesson Progress</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-700 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-gray-700 tabular-nums">{progressPct}%</span>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 ml-2">
          <Flame size={16} className="text-emerald-600 animate-heart-beat" />
          <span className="text-sm font-bold text-emerald-700">{streak}</span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-md p-10 w-full max-w-xl flex flex-col items-center gap-6 animate-fade-in-up opacity-0" style={{ animationDelay: '100ms' }}>
          {/* Speaker icon */}
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center animate-float">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <circle cx="12" cy="8" r="4" />
              <path d="M6 20v-1a6 6 0 0112 0v1" />
              <path d="M19 8c1 0 2 1.5 2 3s-1 3-2 3" strokeLinecap="round" />
            </svg>
          </div>

          <p className="text-xs font-bold tracking-[0.15em] text-emerald-600 uppercase animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>
            Listen and Repeat
          </p>

          <h2
            className="text-2xl font-bold text-gray-900 text-center leading-tight animate-fade-in-up opacity-0"
            style={{ animationDelay: '250ms' }}
          >
            {phrase}
          </h2>

          {/* Play button with ring pulse */}
          <div className="flex flex-col items-center gap-2 animate-fade-in opacity-0" style={{ animationDelay: '350ms' }}>
            <div className="relative flex items-center justify-center">
              {/* Pulsing rings when speaking */}
              {speaking && (
                <>
                  <span className="absolute w-16 h-16 rounded-full bg-emerald-400 animate-ring-pulse" />
                  <span className="absolute w-16 h-16 rounded-full bg-emerald-400 animate-ring-pulse" style={{ animationDelay: '0.4s' }} />
                </>
              )}
              <button
                onClick={handlePlay}
                className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-150 shadow-md active:scale-90 ${
                  speaking
                    ? 'bg-emerald-600 scale-95'
                    : 'bg-emerald-500 hover:bg-emerald-600 hover:scale-110'
                }`}
              >
                {speaking ? (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.6s' }} />
                    <div className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.15s', animationDuration: '0.6s' }} />
                    <div className="w-1.5 h-5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.3s', animationDuration: '0.6s' }} />
                  </div>
                ) : (
                  <Play size={24} fill="white" className="text-white ml-1" />
                )}
              </button>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 italic">
              <Volume2 size={12} />
              <span>Listen to the correct pronunciation</span>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100" />

          {/* Waveform meters */}
          <div className="flex items-end justify-center gap-8 animate-fade-in opacity-0" style={{ animationDelay: '400ms' }}>
            {[
              { label: 'Pitch', bars: [pitchH, bar2H, Math.max(20, pitchH - 15)] },
              { label: 'Clarity', bars: [clarityH, bar4H, Math.max(20, clarityH - 10)] },
            ].map(({ label, bars }) => (
              <div key={label} className="flex flex-col items-center gap-2">
                <div className="flex items-end gap-0.5" style={{ height: 64 }}>
                  {bars.map((h, i) => (
                    <div
                      key={i}
                      className={`rounded-t-full transition-all ${i % 2 === 0 ? 'w-2 bg-emerald-500' : 'w-1.5 bg-emerald-300'}`}
                      style={{
                        height: `${h}%`,
                        transitionDuration: `${130 + i * 40}ms`,
                        transitionTimingFunction: 'ease-out',
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-4 mt-6 w-full max-w-xl animate-fade-in-up opacity-0" style={{ animationDelay: '300ms' }}>
          <button
            onClick={handleTryAgain}
            className="btn-duolingo-secondary flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl"
          >
            <Mic size={18} />
            Try Again
          </button>
          <button
            onClick={handleDone}
            className="btn-duolingo-primary flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl"
          >
            I'm Done
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Tip card */}
        <div
          key={tipIdx}
          className="mt-5 w-full max-w-xl bg-white rounded-2xl p-5 border border-gray-100 flex items-start gap-4 animate-fade-in-up opacity-0"
          style={{ animationDelay: '400ms' }}
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
            <Lightbulb size={18} className="text-emerald-600 animate-wiggle" />
          </div>
          <div>
            <p className="font-semibold text-emerald-600 text-sm mb-1">Friendly Reminder</p>
            <p className="text-sm text-gray-600 leading-relaxed">{TIPS[tipIdx]}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 text-gray-400 text-xs animate-fade-in opacity-0" style={{ animationDelay: '500ms' }}>
          <Shield size={12} />
          <span>Session Secure &amp; Private</span>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState, useMemo } from 'react';
import { Flame, Timer, PartyPopper, AlertCircle, Clock, BookOpen, Repeat2, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { computeStats } from '../lib/stats';
import type { PracticeSession } from '../lib/types';
import Modal from '../components/Modal';

interface Props {
  sessionDurationMins: number;
  dataVersion: number;
  onContinue: () => void;
  lessonId?: string;
}

interface SessionWithLesson extends PracticeSession {
  lessons?: { title: string; day_number: number } | null;
}

const CONFETTI_COLORS = [
  '#22c55e', '#16a34a', '#4ade80', '#86efac',
  '#fbbf24', '#f59e0b', '#34d399', '#6ee7b7',
  '#60a5fa', '#818cf8', '#f472b6', '#fb923c',
];

interface Particle {
  id: number;
  x: number;
  color: string;
  size: number;
  duration: number;
  delay: number;
  shape: 'circle' | 'rect';
}

function Confetti() {
  const particles = useMemo<Particle[]>(() => (
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: 5 + Math.random() * 90,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      duration: 2.2 + Math.random() * 1.8,
      delay: Math.random() * 0.8,
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }))
  ), []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.shape === 'rect' ? p.size * 0.5 : p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

function MistakesModal({ onClose, lessonId }: { onClose: () => void; lessonId?: string }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      let query = supabase
        .from('practice_sessions')
        .select('*, lessons(title, day_number)')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false })
        .limit(20);

      if (lessonId) {
        query = query.eq('lesson_id', lessonId);
      }

      const { data } = await query;
      setSessions((data ?? []) as SessionWithLesson[]);
      setLoading(false);
    };
    fetch();
  }, [user, lessonId]);

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Modal title="Session Review" onClose={onClose} maxWidth="max-w-md">
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <AlertCircle size={32} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No recent sessions to review</p>
          <p className="text-sm mt-1">Complete a practice session to see details here.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-gray-500 mb-2">Your recent practice sessions — focus areas for improvement:</p>
          {sessions.map(s => {
            const lessonLabel = s.lessons
              ? `Day ${s.lessons.day_number}: ${s.lessons.title}`
              : 'General Practice';
            return (
              <div key={s.id} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                  {s.session_type === 'repeat' ? <Repeat2 size={14} className="text-amber-600" /> : <Zap size={14} className="text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{lessonLabel}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock size={10} /> {s.duration_mins} min</span>
                    <span>{formatDate(s.started_at)} at {formatTime(s.started_at)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 italic">Focus on smooth transitions between phrases and maintaining steady pacing.</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

export default function Completion({ sessionDurationMins, dataVersion, onContinue, lessonId }: Props) {
  const { user, profile } = useAuth();
  const [streak, setStreak] = useState(0);
  const [dailyMins, setDailyMins] = useState(0);
  const [goalPct, setGoalPct] = useState(0);
  const [loading, setLoading] = useState(true);
  const [barKey, setBarKey] = useState(0);
  const [showMistakes, setShowMistakes] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;
    const load = async () => {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      const [{ data: sessData }, { count: lessonCount }] = await Promise.all([
        supabase
          .from('practice_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('started_at', since.toISOString()),
        supabase
          .from('lesson_completions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
      ]);
      const s = (sessData ?? []) as PracticeSession[];
      const stats = computeStats(s, lessonCount ?? 0, profile.daily_goal_mins);
      setStreak(stats.currentStreak);
      setDailyMins(stats.todayMinutes);
      setGoalPct(Math.min(100, Math.round((stats.todayMinutes / stats.dailyGoalMins) * 100)));
      setLoading(false);
      setBarKey(k => k + 1);
    };
    load();
  }, [user, profile, dataVersion]);

  const hitGoal = goalPct >= 100;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <Confetti />
      {showMistakes && <MistakesModal onClose={() => setShowMistakes(false)} lessonId={lessonId} />}

      <div className="w-full max-w-md flex flex-col items-center relative z-10">
        {/* Character — bounce in */}
        <div className="relative mb-6 animate-bounce-in opacity-0" style={{ animationDelay: '0ms' }}>
          <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-emerald-400 shadow-xl">
            <img
              src="https://images.pexels.com/photos/7656758/pexels-photo-7656758.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop"
              alt="Celebration"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute bottom-2 right-2 w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center shadow-md border-2 border-white animate-wiggle" style={{ animationDelay: '600ms', animationIterationCount: '3' }}>
            <PartyPopper size={20} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 mb-1 animate-fade-in-up opacity-0" style={{ animationDelay: '200ms' }}>
          <span className="text-2xl animate-float">🎉</span>
          <h1 className="text-3xl font-bold text-emerald-800">Great Job!</h1>
        </div>
        <p className="text-gray-600 mb-8 text-base animate-fade-in-up opacity-0" style={{ animationDelay: '280ms' }}>
          Today's practice completed
        </p>

        {/* Daily goal */}
        <div
          className="w-full bg-white rounded-2xl p-5 border border-gray-200 mb-4 shadow-sm animate-fade-in-up opacity-0"
          style={{ animationDelay: '360ms' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Daily Goal</span>
            {loading ? (
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            ) : (
              <span className={`text-sm font-bold animate-pop-in ${hitGoal ? 'text-emerald-600' : 'text-gray-600'}`}>
                {hitGoal ? '100% Complete' : `${goalPct}% Complete`}
              </span>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mb-3 overflow-hidden">
            <div
              key={barKey}
              className="bg-emerald-500 h-3 rounded-full animated-bar"
              style={{ width: loading ? '0%' : `${goalPct}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 text-center">
            {hitGoal
              ? `You hit your ${profile?.daily_goal_mins ?? 20}-minute daily practice goal!`
              : `${dailyMins} of ${profile?.daily_goal_mins ?? 20} minutes today — keep going!`}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
          <div
            className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-3 animate-pop-in opacity-0"
            style={{ animationDelay: '460ms' }}
          >
            <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center">
              <Flame size={20} className={`text-emerald-600 ${!loading && streak > 0 ? 'animate-heart-beat' : ''}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Current Streak</p>
              {loading ? (
                <div className="h-5 w-16 bg-slate-100 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-xl font-bold text-gray-900 animate-bounce-in">
                  {streak} <span className="text-sm font-normal text-gray-500">Days</span>
                </p>
              )}
            </div>
          </div>

          <div
            className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center gap-3 animate-pop-in opacity-0"
            style={{ animationDelay: '540ms' }}
          >
            <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
              <Timer size={20} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Practice Time</p>
              <p className="text-xl font-bold text-gray-900">
                {sessionDurationMins} <span className="text-sm font-normal text-gray-500">Min</span>
              </p>
            </div>
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={onContinue}
          className="btn-duolingo-primary w-full py-4 rounded-2xl text-base mb-4 animate-fade-in-up opacity-0"
          style={{ animationDelay: '620ms' }}
        >
          Continue
        </button>

        <button
          onClick={() => setShowMistakes(true)}
          className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors hover:underline animate-fade-in opacity-0"
          style={{ animationDelay: '700ms' }}
        >
          Review Session Mistakes
        </button>
      </div>
    </div>
  );
}

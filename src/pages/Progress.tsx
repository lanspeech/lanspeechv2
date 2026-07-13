import { useEffect, useState } from 'react';
import { Flame, ChevronLeft, ChevronRight, TrendingUp, Mic, Rocket, Wind, Repeat2, BookOpen, MessageSquare, Zap, Clock, Share2, History, type LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { computeStats } from '../lib/stats';
import { fetchLessons } from '../lib/lessons';
import type { PracticeSession, UserStats } from '../lib/types';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import Button from '../components/ui/Button';

interface Props {
  dataVersion: number;
  onNavigateTo: (page: 'dashboard' | 'library' | 'progress' | 'profile') => void;
}

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function CalendarCell({
  day, practiced, missedTarget, isToday, isFuture, cellIndex,
}: {
  day: number; practiced: boolean; missedTarget: boolean; isToday: boolean; isFuture: boolean; cellIndex: number;
}) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 animate-pop-in opacity-0"
      style={{ animationDelay: `${cellIndex * 18}ms` }}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200 hover:scale-110 cursor-default ${
          isToday
            ? 'border-emerald-700 bg-white text-emerald-700 shadow-md'
            : practiced && !missedTarget
            ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
            : practiced && missedTarget
            ? 'border-emerald-400 bg-white text-gray-700'
            : isFuture
            ? 'border-transparent bg-slate-100 text-gray-300'
            : 'border-transparent bg-slate-100 text-gray-400'
        }`}
      >
        {day}
      </div>
      <div className={`w-1.5 h-1.5 rounded-full transition-colors ${(practiced && !missedTarget ? 'bg-emerald-500' : 'bg-transparent')}`} />
    </div>
  );
}

interface SessionWithLesson extends PracticeSession {
  lessons?: { title: string; day_number: number } | null;
}

const SESSION_META: Record<string, { label: string; Icon: LucideIcon }> = {
  breathing: { label: 'Breathing', Icon: Wind },
  repeat: { label: 'Repeat After Me', Icon: Repeat2 },
  read_aloud: { label: 'Read Aloud', Icon: BookOpen },
  speak_freely: { label: 'Speak Freely', Icon: MessageSquare },
  general: { label: 'General Practice', Icon: Zap },
};

function HistoryModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionWithLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('practice_sessions')
      .select('*, lessons(title, day_number)')
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(150)
      .then(({ data }) => {
        setSessions((data ?? []) as SessionWithLesson[]);
        setLoading(false);
      });
  }, [user]);

  const grouped = sessions.reduce<Record<string, SessionWithLesson[]>>((acc, s) => {
    const d = isoDate(new Date(s.started_at));
    (acc[d] ??= []).push(s);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

  const formatDate = (iso: string) => {
    const d = new Date(iso + 'T00:00:00');
    const today = isoDate(new Date());
    const yesterday = isoDate(new Date(Date.now() - 86400000));
    if (iso === today) return 'Today';
    if (iso === yesterday) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  const totalMins = sessions.reduce((s, x) => s + x.duration_mins, 0);

  return (
    <Modal title="Practice History" onClose={onClose} maxWidth="max-w-xl">
      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <History size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-medium">No sessions recorded yet.</p>
          <p className="text-sm mt-1">Complete your first practice to see history here.</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <div>
              <p className="text-sm text-gray-500">{sessions.length} sessions</p>
              <p className="font-bold text-gray-900 text-lg">{totalMins} minutes total</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">{sortedDates.length} active days</p>
              <p className="font-bold text-emerald-700 text-lg">
                {sortedDates.length > 0 ? Math.round(totalMins / sortedDates.length) : 0} min / day
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {sortedDates.map(date => {
              const daySessions = grouped[date];
              const dayTotal = daySessions.reduce((s, x) => s + x.duration_mins, 0);
              return (
                <div key={date}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{formatDate(date)}</p>
                    <p className="text-xs text-emerald-600 font-semibold">{dayTotal} min</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {daySessions.map(s => {
                      const meta = SESSION_META[s.session_type] ?? SESSION_META.general;
                      const Icon = meta.Icon;
                      const lessonLabel = s.lessons
                        ? `Day ${s.lessons.day_number}: ${s.lessons.title}`
                        : meta.label;
                      return (
                        <div key={s.id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <Icon size={14} className="text-emerald-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 truncate">{lessonLabel}</p>
                            <p className="text-xs text-gray-400">{formatTime(s.started_at)}</p>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
                            <Clock size={11} />
                            <span>{s.duration_mins} min</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}

export default function Progress({ dataVersion, onNavigateTo }: Props) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [calMonth, setCalMonth] = useState(new Date());
  const [barKey, setBarKey] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !profile) return;
    const load = async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - 180);
      const [{ data: sessData }, { data: completions }, lessons] = await Promise.all([
        supabase
          .from('practice_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('started_at', since.toISOString()),
        supabase
          .from('lesson_completions')
          .select('lesson_id')
          .eq('user_id', user.id),
        fetchLessons(),
      ]);
      const s = (sessData ?? []) as PracticeSession[];
      const lessonIds = new Set(lessons.map(lesson => lesson.id));
      const completedCount = (completions ?? []).filter(item => lessonIds.has(item.lesson_id)).length;
      setSessions(s);
      setStats(computeStats(s, completedCount, profile.daily_goal_mins));
      setLoading(false);
      setBarKey(k => k + 1);
    };
    load();
  }, [user, profile, dataVersion]);

  const year = calMonth.getFullYear();
  const month = calMonth.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfWeek + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = isoDate(today);
  const monthName = calMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCalMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCalMonth(new Date(year, month + 1, 1));

  const totalPracticeMins = sessions.reduce((sum, s) => sum + s.duration_mins, 0);

  const thisWeekMins = sessions
    .filter(s => (today.getTime() - new Date(s.started_at).getTime()) / 86400000 < 7)
    .reduce((sum, s) => sum + s.duration_mins, 0);
  const lastWeekMins = sessions
    .filter(s => {
      const diff = (today.getTime() - new Date(s.started_at).getTime()) / 86400000;
      return diff >= 7 && diff < 14;
    })
    .reduce((sum, s) => sum + s.duration_mins, 0);
  const weekChangePct = lastWeekMins > 0
    ? Math.round(((thisWeekMins - lastWeekMins) / lastWeekMins) * 100)
    : 0;

  const milestonePct = Math.min(100, ((stats?.lessonsCompleted ?? 0) / 20) * 100);

  const handleShare = async () => {
    const text = [
      `🌿 LanSpeech Practice Update`,
      `${profile?.display_name ? `${profile.display_name}'s stats:` : 'My stats:'}`,
      `🔥 ${stats?.currentStreak ?? 0}-day streak`,
      `⏱ ${totalPracticeMins} minutes practiced`,
      `✅ ${stats?.lessonsCompleted ?? 0} lessons completed`,
    ].join('\n');

    try {
      if (navigator.share) {
        await navigator.share({ title: 'My LanSpeech Progress', text });
      } else {
        await navigator.clipboard.writeText(text);
        setToast('Progress copied to clipboard!');
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setToast('Progress copied to clipboard!');
      } catch {
        setToast('Could not share at this time.');
      }
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-8 overflow-y-auto">
      {showHistory && <HistoryModal onClose={() => setShowHistory(false)} />}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between animate-fade-in-up opacity-0" style={{ animationDelay: '0ms' }}>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Journey</h1>
            <p className="text-gray-500 mt-1">Celebrate how far you've come today.</p>
          </div>
          <button
            onClick={() => setShowHistory(true)}
            className="flex items-center gap-2 text-sm text-emerald-700 font-semibold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-xl transition-colors active:scale-95"
          >
            <History size={16} />
            View History
          </button>
        </div>

        {/* Top stat cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover animate-fade-in-up opacity-0" style={{ animationDelay: '60ms' }}>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <Flame size={20} className={`text-emerald-600 ${!loading && (stats?.currentStreak ?? 0) > 0 ? 'animate-heart-beat' : ''}`} />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Current Streak</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {loading ? <span className="text-gray-300">–</span> : stats?.currentStreak ?? 0}{' '}
              <span className="text-lg font-semibold text-gray-600">Days</span>
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover animate-fade-in-up opacity-0" style={{ animationDelay: '120ms' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Practice Time</p>
              {weekChangePct !== 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full animate-pop-in ${weekChangePct >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                  {weekChangePct >= 0 ? '+' : ''}{weekChangePct}% this week
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? <span className="text-gray-300">–</span> : totalPracticeMins}{' '}
              <span className="text-lg font-normal text-gray-500">mins</span>
            </p>
            <div className="mt-3 h-12 relative">
              <svg viewBox="0 0 200 50" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,40 C30,35 60,20 100,15 C140,10 170,25 200,10" stroke="#16a34a" strokeWidth="2" fill="none" />
                <path d="M0,40 C30,35 60,20 100,15 C140,10 170,25 200,10 L200,50 L0,50 Z" fill="url(#chartGrad)" />
              </svg>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm card-hover animate-fade-in-up opacity-0" style={{ animationDelay: '180ms' }}>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
              <TrendingUp size={20} className="text-emerald-600" />
            </div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">Lessons</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {loading ? <span className="text-gray-300">–</span> : stats?.lessonsCompleted ?? 0}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Calendar */}
          <div className="col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-fade-in-up opacity-0" style={{ animationDelay: '240ms' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-gray-900 text-base">Consistency Calendar</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={prevMonth}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:scale-110 active:scale-95 transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[110px] text-center">{monthName}</span>
                <button
                  onClick={nextMonth}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:scale-110 active:scale-95 transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => (
                <div key={d} className="text-center text-xs text-gray-400 font-medium pb-2">{d}</div>
              ))}

              {Array.from({ length: startOffset }).map((_, i) => <div key={`e${i}`} />)}

              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day, idx) => {
                const dateStr = isoDate(new Date(year, month, day));
                const practiced = stats?.practicedDates.has(dateStr) ?? false;
                const missedTarget = stats?.missedTargetDates.has(dateStr) ?? false;
                const isToday = dateStr === todayStr;
                const isFuture = new Date(year, month, day) > today;

                return (
                  <div key={day} className="flex justify-center">
                    <CalendarCell
                      day={day}
                      practiced={practiced}
                      missedTarget={missedTarget}
                      isToday={isToday}
                      isFuture={isFuture}
                      cellIndex={idx}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-5 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 rounded-full bg-emerald-500" /> Practiced
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-3 h-3 rounded-full border-2 border-emerald-400" /> Missed Target
              </div>
            </div>
          </div>

          {/* Right side */}
          <div className="flex flex-col gap-4">
            <div className="bg-emerald-800 rounded-2xl p-5 text-white card-hover animate-fade-in-up opacity-0" style={{ animationDelay: '300ms' }}>
              <p className="text-xs text-emerald-300 uppercase tracking-wider font-medium mb-2">Longest Streak</p>
              <p className="text-4xl font-bold">
                {loading ? '–' : stats?.longestStreak ?? 0}{' '}
                <span className="text-2xl font-semibold">Days</span>
              </p>
              <p className="text-emerald-300 text-xs mt-2">
                {(stats?.longestStreak ?? 0) >= 20
                  ? "You're in the top 5% of learners this month!"
                  : 'Keep going to beat your record!'}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex-1 animate-fade-in-up opacity-0" style={{ animationDelay: '360ms' }}>
              <h4 className="font-semibold text-gray-900 mb-3">Next Milestone</h4>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <Mic size={16} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Voice Master II</p>
                  <p className="text-xs text-gray-500">{stats?.lessonsCompleted ?? 0}/20 sessions completed</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  key={barKey}
                  className="bg-emerald-700 h-2 rounded-full animated-bar"
                  style={{ width: `${milestonePct}%` }}
                />
              </div>
              <Button
                onClick={() => onNavigateTo('library')}
                size="lg"
                className="w-full"
              >
                Keep Practicing
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom motivational card */}
        <div className="mt-6 bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center animate-fade-in-up opacity-0" style={{ animationDelay: '420ms' }}>
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 animate-float">
            <Rocket size={24} className="text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">You're doing amazing!</h3>
          <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
            Consistency is the key to speech success. Your streak proves that you're dedicated to your growth.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <Button
              onClick={handleShare}
              size="md"
              className="w-full sm:w-auto"
            >
              <Share2 size={14} />
              Share Progress
            </Button>
            <Button
              onClick={() => setShowHistory(true)}
              variant="secondary"
              size="md"
              className="w-full sm:w-auto"
            >
              <History size={14} />
              View History
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Wind, Repeat2, BookOpen, MessageSquare, Play, Flame, Calendar, CheckCircle, Timer, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { computeStats } from '../lib/stats';
import type { Lesson, PracticeSession, UserStats } from '../lib/types';

interface Props {
  onStartPractice: (lesson?: Lesson | null) => void;
  dataVersion: number;
}

const practiceTypes = [
  { icon: Wind, label: 'Breathing' },
  { icon: Repeat2, label: 'Repeat After Me' },
  { icon: BookOpen, label: 'Read Aloud' },
  { icon: MessageSquare, label: 'Speak Freely' },
];

function StatRow({ icon: Icon, label, value, unit, color, delay = 0 }: {
  icon: React.ComponentType<{ size: number; className?: string }>;
  label: string; value: string; unit: string; color: string; delay?: number;
}) {
  return (
    <div
      className="flex items-center gap-3 animate-fade-in-up opacity-0"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
      </div>
      <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
        {value}{unit && <span className="font-normal text-gray-500 ml-1 text-xs">{unit}</span>}
      </span>
    </div>
  );
}

export default function Dashboard({ onStartPractice, dataVersion }: Props) {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [nextLesson, setNextLesson] = useState<Lesson | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [barKey, setBarKey] = useState(0);

  useEffect(() => {
    if (!user || !profile) return;

    const load = async () => {
      setLoadingStats(true);
      const since = new Date();
      since.setDate(since.getDate() - 90);

      const [{ data: sessions }, { data: completions }] = await Promise.all([
        supabase
          .from('practice_sessions')
          .select('*')
          .eq('user_id', user.id)
          .gte('started_at', since.toISOString()),
        supabase
          .from('lesson_completions')
          .select('lesson_id')
          .eq('user_id', user.id),
      ]);

      const completedIds = new Set((completions ?? []).map(c => c.lesson_id));
      const computed = computeStats(
        (sessions ?? []) as PracticeSession[],
        completedIds.size,
        profile.daily_goal_mins
      );
      setStats(computed);

      const { data: lessons } = await supabase
        .from('lessons')
        .select('*')
        .eq('is_bonus', false)
        .order('order_index');
      if (lessons) {
        for (const l of lessons) {
          if (!completedIds.has(l.id)) { setNextLesson(l as Lesson); break; }
        }
      }
      setLoadingStats(false);
      setBarKey(k => k + 1);
    };

    load();
  }, [user, profile, dataVersion]);

  const dailyPct = stats
    ? Math.min(100, Math.round((stats.todayMinutes / stats.dailyGoalMins) * 100))
    : 0;
  const remaining = stats ? Math.max(0, stats.dailyGoalMins - stats.todayMinutes) : 0;

  return (
    <div className="flex-1 bg-slate-50 min-h-screen p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back {profile?.display_name ? profile.display_name.split(' ')[0] : ''} <span>👋</span>
          </h1>
          <p className="text-gray-500">Ready for your daily gentle practice?</p>
        </div>

        <div className="flex gap-6">
          {/* Left column */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">
            {/* Today's Practice */}
            <div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in-up opacity-0"
              style={{ animationDelay: '80ms' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-700">Today's Practice</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Approx. 15 minutes to complete</p>
                </div>
                <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full animate-pop-in" style={{ animationDelay: '300ms' }}>
                  Recommended
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5 mb-5">
                {practiceTypes.map(({ icon: Icon, label }, i) => (
                  <button
                    key={label}
                    onClick={() => onStartPractice(nextLesson)}
                    className="group flex items-center gap-3 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 active:scale-95 rounded-2xl px-4 py-4 transition-all duration-150 border border-slate-100 text-left animate-fade-in-up opacity-0"
                    style={{ animationDelay: `${160 + i * 50}ms` }}
                  >
                    <div className="w-9 h-9 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:scale-110 transition-all duration-200">
                      <Icon size={18} className="text-emerald-600 icon-wiggle" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => onStartPractice(nextLesson)}
                className="btn-duolingo-primary w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base animate-fade-in-up opacity-0"
                style={{ animationDelay: '380ms' }}
              >
                <Play size={16} fill="white" />
                Start Practice
              </button>
            </div>

            {/* Achievement / streak banner */}
            <div
              className="bg-gray-50 rounded-2xl p-5 flex items-center gap-4 border border-gray-100 animate-slide-in-left opacity-0"
              style={{ animationDelay: '200ms' }}
            >
              <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                <Award size={24} className="text-emerald-600 animate-float" />
              </div>
              <div>
                {stats && stats.currentStreak > 0 ? (
                  <>
                    <p className="font-semibold text-gray-800">
                      Great Progress, {profile?.display_name?.split(' ')[0] ?? 'you'}!
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      You've reached a {stats.currentStreak}-day streak. Your consistency is building confidence. Keep it up!
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800">Start your streak today!</p>
                    <p className="text-sm text-gray-500 mt-0.5">Complete a practice session to begin your journey.</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="w-64 shrink-0 flex flex-col gap-5">
            {/* Stats */}
            <div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in-up opacity-0"
              style={{ animationDelay: '120ms' }}
            >
              <h3 className="font-semibold text-gray-900 mb-4">Your Stats</h3>
              {loadingStats ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-8 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <StatRow icon={Flame} label="Current Streak" value={String(stats?.currentStreak ?? 0)} unit="Days" color="bg-emerald-100 text-emerald-600" delay={0} />
                  <StatRow icon={Calendar} label="Total Days" value={String(stats?.totalDays ?? 0)} unit="" color="bg-blue-100 text-blue-500" delay={60} />
                  <StatRow icon={CheckCircle} label="Lessons Completed" value={String(stats?.lessonsCompleted ?? 0)} unit="" color="bg-purple-100 text-purple-500" delay={120} />
                  <StatRow icon={Timer} label="Practice Minutes" value={String(stats?.practiceMinutes ?? 0)} unit="" color="bg-orange-100 text-orange-500" delay={180} />
                </div>
              )}
            </div>

            {/* Daily Goal */}
            <div
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-fade-in-up opacity-0"
              style={{ animationDelay: '200ms' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Daily Goal</h3>
                <span className="text-emerald-600 text-sm font-medium">
                  {stats?.todayMinutes ?? 0}/{profile?.daily_goal_mins ?? 20}m
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-2 overflow-hidden">
                <div
                  key={barKey}
                  className="bg-emerald-700 h-2.5 rounded-full animated-bar"
                  style={{ width: `${dailyPct}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {dailyPct >= 100
                  ? 'Daily goal complete! Great work.'
                  : remaining > 0
                  ? `${remaining} more minutes to hit your goal.`
                  : 'Start practicing to track your progress.'}
              </p>
            </div>

            {/* Connected Specialist */}
            <div
              className="bg-emerald-800 rounded-2xl p-5 text-white animate-fade-in-up opacity-0 hover:bg-emerald-700 transition-colors cursor-pointer"
              style={{ animationDelay: '280ms' }}
            >
              <p className="text-xs text-emerald-300 mb-1">Connected Specialist</p>
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={
                    profile?.specialist_photo_url ??
                    'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop'
                  }
                  alt={profile?.specialist_name ?? 'Specialist'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 hover:scale-105 transition-transform"
                />
                <div>
                  <p className="font-bold text-base leading-tight">
                    {profile?.specialist_name ?? 'Dr. Sarah Chen'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

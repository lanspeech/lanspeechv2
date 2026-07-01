import { useEffect, useState } from 'react';
import { Wind, Repeat2, BookOpen, MessageSquare, Play, Flame, Calendar, CheckCircle, Timer, Award, type LucideIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { computeStats } from '../lib/stats';
import { fetchLessons } from '../lib/lessons';
import type { Lesson, PracticeSession, UserStats } from '../lib/types';

interface Props {
  onStartPractice: (lesson?: Lesson | null) => void;
  dataVersion: number;
}

const journeySteps = [
  { icon: Wind, label: 'Breathe', detail: 'Settle your breath and calm your voice' },
  { icon: Repeat2, label: 'Repeat', detail: 'Mirror the phrase with gentle rhythm' },
  { icon: BookOpen, label: 'Read', detail: 'Read the line out loud with confidence' },
  { icon: MessageSquare, label: 'Speak', detail: 'Share your words in your own voice' },
  { icon: CheckCircle, label: 'Complete', detail: 'Finish the lesson and celebrate' },
];

function StatRow({ icon: Icon, label, value, unit, color, delay = 0 }: {
  icon: LucideIcon;
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
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
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
      const lessons = await fetchLessons();
      const lessonIds = new Set(lessons.map(lesson => lesson.id));
      const completedCurrentLessons = [...completedIds].filter(id => lessonIds.has(id)).length;
      const computed = computeStats(
        (sessions ?? []) as PracticeSession[],
        completedCurrentLessons,
        profile.daily_goal_mins
      );
      setStats(computed);

      const pendingLessons = lessons.filter(l => !completedIds.has(l.id));

      let selectedLesson = pendingLessons[0] ?? lessons[0] ?? null;
      let savedStep = 0;

      if (selectedLesson) {
        const savedProgress = pendingLessons
          .map(lesson => {
            const saved = localStorage.getItem(`lesson-progress-${lesson.id}`);
            if (!saved) return null;
            try {
              const parsed = JSON.parse(saved) as { lessonId: string; exerciseIndex: number; updatedAt: string };
              if (parsed.lessonId === lesson.id && Number.isFinite(parsed.exerciseIndex)) {
                const exerciseCount = lesson.exercises?.length ?? 0;
                return {
                  lesson,
                  exerciseIndex: Math.min(Math.max(0, parsed.exerciseIndex), Math.max(0, exerciseCount - 1)),
                  updatedAt: new Date(parsed.updatedAt),
                };
              }
            } catch {
              return null;
            }
            return null;
          })
          .filter(Boolean) as Array<{ lesson: Lesson; exerciseIndex: number; updatedAt: Date }>;

        if (savedProgress.length > 0) {
          savedProgress.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
          selectedLesson = savedProgress[0].lesson;
          savedStep = savedProgress[0].exerciseIndex;
        }
      }

      setNextLesson(selectedLesson);
      setCurrentExerciseIndex(savedStep);
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
    <div className="flex-1 bg-slate-50 min-h-screen p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Welcome back {profile?.display_name ? profile.display_name.split(' ')[0] : ''} <span>👋</span>
          </h1>
          <p className="text-gray-500">Ready for your first calm practice? This journey is built for stammerers with gentle pacing and support.</p>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <div
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-fade-in-up opacity-0"
              style={{ animationDelay: '80ms' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-lg font-semibold text-emerald-700">Today's Practice</h2>
                  <p className="text-sm text-gray-500 mt-0.5">A calm, guided lesson designed for stammerers: gentle starts, slow pace, and steady support.</p>
                </div>
                <span className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-full animate-pop-in" style={{ animationDelay: '300ms' }}>
                  New Journey
                </span>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4 mt-5 mb-5 animate-fade-in-up opacity-0" style={{ animationDelay: '160ms' }}>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-emerald-700">Lesson Journey</p>
                    <h3 className="text-base font-semibold text-gray-900 mt-1">{nextLesson?.title ?? 'Your next practice lesson'}</h3>
                    <p className="text-sm text-gray-500 mt-1">{nextLesson?.description ?? 'Each lesson is broken into small wins so progress feels rewarding.'}</p>
                  </div>
                  <div className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white whitespace-nowrap">
                    Step {Math.min(currentExerciseIndex + 1, journeySteps.length)} of {journeySteps.length}
                  </div>
                </div>

                <div className="space-y-2">
                  {journeySteps.map(({ icon: Icon, label, detail }, i) => {
                    const currentStep = Math.min(currentExerciseIndex, journeySteps.length - 2);
                    const isCurrent = i === currentStep;
                    return (
                      <div
                        key={label}
                        className={`flex items-center gap-3 rounded-2xl border px-3 py-3 transition-all ${isCurrent ? 'border-emerald-200 bg-white shadow-sm' : i < currentStep ? 'border-emerald-100 bg-emerald-50/80' : 'border-transparent bg-emerald-50/70'}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-600 border border-emerald-100'}`}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{label}</p>
                          <p className="text-xs text-gray-500 truncate">{detail}</p>
                        </div>
                        <span className={`text-[11px] font-semibold uppercase tracking-wide ${isCurrent ? 'text-emerald-700' : i < currentStep ? 'text-emerald-600' : 'text-gray-400'}`}>
                          {isCurrent ? 'Now' : i === journeySteps.length - 1 ? 'Finish' : 'Next'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => onStartPractice(nextLesson)}
                className="btn-duolingo-primary w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base animate-fade-in-up opacity-0"
                style={{ animationDelay: '380ms' }}
              >
                <Play size={16} fill="white" />
                Continue Lesson
              </button>
            </div>

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
                    <p className="font-semibold text-gray-800">Great Progress, {profile?.display_name?.split(' ')[0] ?? 'you'}!</p>
                    <p className="text-sm text-gray-500 mt-0.5">You've reached a {stats.currentStreak}-day streak. Your consistency is building confidence. Keep it up!</p>
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

          <div className="w-full lg:w-64 shrink-0 flex flex-col gap-5">
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

            <div
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-fade-in-up opacity-0"
              style={{ animationDelay: '200ms' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Daily Goal</h3>
                <span className="text-emerald-600 text-sm font-medium">{stats?.todayMinutes ?? 0}/{profile?.daily_goal_mins ?? 20}m</span>
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

            <div
              className="bg-emerald-800 rounded-2xl p-5 text-white animate-fade-in-up opacity-0 hover:bg-emerald-700 transition-colors cursor-pointer"
              style={{ animationDelay: '280ms' }}
            >
              <p className="text-xs text-emerald-300 mb-1">Connected Specialist</p>
              <div className="flex items-center gap-3 mt-2">
                <img
                  src={profile?.specialist_photo_url ?? 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=80&h=80&fit=crop'}
                  alt={profile?.specialist_name ?? 'Specialist'}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-600 hover:scale-105 transition-transform"
                />
                <div>
                  <p className="font-bold text-base leading-tight">{profile?.specialist_name ?? 'Dr. Sarah Chen'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

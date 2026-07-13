import { useEffect, useMemo, useState } from 'react';
import { Search, CheckCircle, Play, Lock, Sparkles, Wind, Repeat2, BookOpen, MessageSquare } from 'lucide-react';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { fetchUnits } from '../lib/lessons';
import type { Lesson, Unit } from '../lib/types';

interface Props {
  onStartLesson: (lesson: Lesson) => void;
  dataVersion: number;
}

type Status = 'completed' | 'current' | 'locked';

export default function Library({ onStartLesson, dataVersion }: Props) {
  const { user } = useAuth();
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: completionsData }, unitsData] = await Promise.all([
          supabase
            .from('lesson_completions')
            .select('lesson_id')
            .eq('user_id', user.id),
          fetchUnits(),
        ]);
        setCompletedIds(new Set((completionsData ?? []).map(c => c.lesson_id)));
        setUnits(unitsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load lessons.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, dataVersion]);

  const visibleUnits = useMemo(() => {
    const firstPendingId = units.flatMap(unit => unit.lessons).find(lesson => !completedIds.has(lesson.id))?.id;
    return units
      .map(unit => {
        return {
          ...unit,
          lessons: unit.lessons
            .map(lesson => {
              const isCompleted = completedIds.has(lesson.id);
              const isCurrent = !isCompleted && lesson.id === firstPendingId;
              return {
                ...lesson,
                status: isCompleted ? 'completed' as Status : isCurrent ? 'current' as Status : 'locked' as Status,
              };
            })
            .filter(lesson => {
              const text = `${lesson.title} ${lesson.description}`.toLowerCase();
              return text.includes(search.toLowerCase());
            }),
        };
      })
      .filter(unit => unit.lessons.length > 0);
  }, [units, completedIds, search]);

  const totalLessons = units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const completedCount = units.reduce((sum, unit) => sum + unit.lessons.filter(lesson => completedIds.has(lesson.id)).length, 0);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen overflow-y-auto">
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-100 px-4 sm:px-8 py-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Speech Practice Library</h1>
        <p className="text-gray-500 text-sm mb-4">Designed for stammerers: small steps, gentle pacing, and supportive speech practice.</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-emerald-100 rounded-full h-2.5 overflow-hidden">
            <div className="bg-emerald-700 h-2.5 rounded-full" style={{ width: `${totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0}%` }} />
          </div>
          <span className="text-sm text-emerald-700 font-medium whitespace-nowrap">{completedCount}/{totalLessons} lessons done</span>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-6 max-w-6xl mx-auto">
        <div className="relative flex-1 min-w-48 mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search lessons..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-full border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 transition-all"
          />
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading your unit plan...</div>
        ) : error ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : (
          <div className="space-y-8">
            {visibleUnits.map(unit => (
              <section key={unit.id} className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700 font-semibold">{unit.title}</p>
                    <h2 className="text-xl font-semibold text-gray-900 mt-1">{unit.theme}</h2>
                    <p className="text-sm text-gray-500 mt-1">{unit.description}</p>
                  </div>
                  <div className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{unit.lessons.length} lessons</div>
                </div>

                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                  {unit.lessons.map((lesson, index) => {
                    const icons = [Wind, Repeat2, BookOpen, MessageSquare];
                    const steps = lesson.exercises?.slice(0, 4) ?? [];
                    return (
                      <div key={lesson.id} className={`rounded-2xl border p-4 ${lesson.status === 'current' ? 'border-emerald-700 bg-emerald-50/60' : lesson.status === 'completed' ? 'border-emerald-200 bg-white' : 'border-gray-200 bg-slate-50'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-700 font-semibold">Lesson {index + 1}</p>
                            <h3 className="font-semibold text-gray-900 mt-1">{lesson.title}</h3>
                          </div>
                          {lesson.status === 'completed' ? <CheckCircle size={18} className="text-emerald-500" /> : lesson.status === 'current' ? <Play size={18} className="text-emerald-600" /> : <Lock size={16} className="text-gray-400" />}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{lesson.description}</p>
                        <div className="space-y-2 mb-4">
                          {steps.map((exercise, stepIndex) => {
                            const Icon = icons[stepIndex % icons.length];
                            return (
                              <div key={exercise.id} className="flex items-center gap-2 rounded-xl bg-white px-2.5 py-2 border border-gray-100">
                                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                  <Icon size={13} className="text-emerald-700" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800">{exercise.title}</p>
                                  <p className="text-[11px] text-gray-500 truncate">{exercise.description}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="text-xs text-gray-500">{lesson.duration_mins} mins</div>
                          <Button
                            onClick={() => lesson.status !== 'locked' && onStartLesson(lesson as Lesson)}
                            disabled={lesson.status === 'locked'}
                            className="flex items-center gap-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                            size="md"
                          >
                            {lesson.status === 'completed' ? 'Review' : lesson.status === 'current' ? 'Continue' : 'Locked'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
            {visibleUnits.length === 0 && <div className="text-center py-16 text-gray-400">No lessons match that search yet.</div>}
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-600 to-emerald-500 p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-semibold">Your course stays in sync</p>
              <p className="text-sm text-emerald-50">The aim is not perfection. It is relaxed breathing, slower speech, and more confidence for stammerers.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

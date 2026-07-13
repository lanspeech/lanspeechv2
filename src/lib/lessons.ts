import { supabase } from './supabase';
import { getAllLessons } from './content';
import type { Lesson, LessonExerciseContent, Unit } from './types';

interface DbUnit {
  id: string;
  slug: string;
  title: string;
  theme: string;
  goal: string;
  description: string;
  order_index: number;
}

interface DbLesson {
  id: string;
  slug: string | null;
  day_number: number;
  title: string;
  description: string;
  duration_mins: number;
  level: string;
  module: string;
  practice_phrase: string | null;
  is_bonus: boolean;
  order_index: number;
  unit_id: string | null;
  goal: string | null;
  coach_tip: string | null;
  reflection_prompt: string | null;
  exercises: unknown;
  units?: DbUnit | null;
}

function isExercise(value: unknown): value is LessonExerciseContent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<LessonExerciseContent>;
  return Boolean(candidate.id && candidate.title && candidate.kind && candidate.description);
}

function parseExercises(value: unknown): LessonExerciseContent[] {
  return Array.isArray(value) ? value.filter(isExercise) : [];
}

function mapLesson(row: DbLesson): Lesson {
  return {
    id: row.id,
    slug: row.slug ?? undefined,
    day_number: row.day_number,
    title: row.title,
    description: row.description,
    duration_mins: row.duration_mins,
    level: row.level,
    module: row.module,
    practice_phrase: row.practice_phrase,
    is_bonus: row.is_bonus,
    order_index: row.order_index,
    unit_id: row.unit_id ?? undefined,
    unit_slug: row.units?.slug,
    unit_title: row.units?.title,
    unit_theme: row.units?.theme,
    unit_goal: row.units?.goal,
    unit_description: row.units?.description,
    unit_order_index: row.units?.order_index,
    goal: row.goal ?? undefined,
    coachTip: row.coach_tip ?? undefined,
    exercises: parseExercises(row.exercises),
    reflection_prompt: row.reflection_prompt ?? undefined,
  };
}

export async function fetchLessons(): Promise<Lesson[]> {
  const { data, error } = await supabase
    .from('lessons')
    .select('*, units(id, slug, title, theme, goal, description, order_index)')
    .not('unit_id', 'is', null)
    .eq('is_bonus', false)
    .order('order_index', { ascending: true });

  if (error) {
    return getAllLessons();
  }

  const dbLessons = ((data ?? []) as DbLesson[]).map(mapLesson);
  if (dbLessons.length === 0) {
    return getAllLessons();
  }

  const staticLessons = getAllLessons();
  const merged = new Map<string, Lesson>();
  for (const lesson of dbLessons) merged.set(lesson.id, lesson);
  for (const lesson of staticLessons) {
    if (!merged.has(lesson.id)) merged.set(lesson.id, lesson);
  }

  return [...merged.values()].sort((a, b) => a.order_index - b.order_index);
}

export async function fetchLessonById(lessonId: string): Promise<Lesson | null> {
  const lessons = await fetchLessons();
  return lessons.find(lesson => lesson.id === lessonId) ?? null;
}

export async function fetchUnits(): Promise<Unit[]> {
  const lessons = await fetchLessons();
  const groups = new Map<string, Unit>();

  for (const lesson of lessons) {
    const unitId = lesson.unit_id;
    if (!unitId) continue;

    if (!groups.has(unitId)) {
      groups.set(unitId, {
        id: unitId,
        slug: lesson.unit_slug ?? '',
        title: lesson.unit_title ?? lesson.module,
        theme: lesson.unit_theme ?? lesson.module,
        goal: lesson.unit_goal ?? '',
        description: lesson.unit_description ?? '',
        order_index: lesson.unit_order_index ?? lesson.order_index,
        lessons: [],
      });
    }

    groups.get(unitId)!.lessons.push(lesson);
  }

  return [...groups.values()].sort((a, b) => a.order_index - b.order_index);
}

export async function fetchNextLesson(currentLesson: Lesson): Promise<Lesson | null> {
  const lessons = await fetchLessons();
  const currentIndex = lessons.findIndex(lesson => lesson.id === currentLesson.id);
  return currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
}

export async function fetchUnitLessons(unitId: string): Promise<Lesson[]> {
  const lessons = await fetchLessons();
  return lessons.filter(lesson => lesson.unit_id === unitId);
}

// Helper used by tests and UI to determine the current lesson for strict progression.
// - `lessons` should be ordered by `order_index` ascending.
// - `completedIds` is a Set of lesson ids the user has completed.
// Returns the first incomplete lesson or null if all are completed.
export function resolveCurrentLessonForProgression(
  lessons: Lesson[],
  completedLessonIds: Iterable<string>
): Lesson | null {
  const completedIds = new Set(completedLessonIds);
  return lessons.find(lesson => !completedIds.has(lesson.id)) ?? null;
}

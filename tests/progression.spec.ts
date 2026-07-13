import { test, expect } from '@playwright/test';
import { resolveCurrentLessonForProgression } from '../src/lib/lessons';
import type { Lesson } from '../src/lib/types';

const lessons: Lesson[] = [
  {
    id: 'lesson-1',
    day_number: 1,
    title: 'Lesson 1',
    description: 'First lesson',
    duration_mins: 10,
    level: 'beginner',
    module: 'Intro',
    practice_phrase: null,
    is_bonus: false,
    order_index: 1,
    unit_id: 'unit-1',
    exercises: [],
  },
  {
    id: 'lesson-2',
    day_number: 2,
    title: 'Lesson 2',
    description: 'Second lesson',
    duration_mins: 10,
    level: 'beginner',
    module: 'Intro',
    practice_phrase: null,
    is_bonus: false,
    order_index: 2,
    unit_id: 'unit-1',
    exercises: [],
  },
  {
    id: 'lesson-3',
    day_number: 3,
    title: 'Lesson 3',
    description: 'Third lesson',
    duration_mins: 10,
    level: 'beginner',
    module: 'Intro',
    practice_phrase: null,
    is_bonus: false,
    order_index: 3,
    unit_id: 'unit-1',
    exercises: [],
  },
];

test.describe('strict lesson progression', () => {
  test('selects the first incomplete lesson even when later lessons have saved progress', () => {
    // Simulate that lesson-3 has some saved progress (ignored by strict progression)
    const currentLesson = resolveCurrentLessonForProgression(lessons, new Set(['lesson-1']));

    expect(currentLesson?.id).toBe('lesson-2');
  });

  test('returns null when all lessons are completed', () => {
    const currentLesson = resolveCurrentLessonForProgression(lessons, new Set(['lesson-1', 'lesson-2', 'lesson-3']));

    expect(currentLesson).toBeNull();
  });
});

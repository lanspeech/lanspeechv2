import { test, expect } from '@playwright/test';
import { computeStats } from '../src/lib/stats';
import type { PracticeSession } from '../src/lib/types';

test.describe('computeStats', () => {
  test('calculates today minutes and current streak for goal-met today', () => {
    const today = new Date();
    const todayIso = today.toISOString();
    const sessions: PracticeSession[] = [
      { id: '1', user_id: 'u1', lesson_id: null, session_type: 'general', duration_mins: 30, started_at: todayIso, completed_at: null },
    ];

    const stats = computeStats(sessions, 0, 20);

    expect(stats.todayMinutes).toBe(30);
    expect(stats.practiceMinutes).toBe(30);
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(1);
    expect(stats.totalDays).toBe(1);
    expect(stats.practicedDates.has(new Date(todayIso).toLocaleDateString('en-CA'))).toBe(true);
    expect(stats.missedTargetDates.size).toBe(0);
  });

  test('counts missed target and zero streak for under-target day', () => {
    const today = new Date();
    const todayIso = today.toISOString();
    const sessions: PracticeSession[] = [
      { id: '2', user_id: 'u1', lesson_id: null, session_type: 'general', duration_mins: 10, started_at: todayIso, completed_at: null },
    ];

    const stats = computeStats(sessions, 0, 20);

    expect(stats.todayMinutes).toBe(10);
    expect(stats.currentStreak).toBe(0);
    expect(stats.longestStreak).toBe(0);
    expect(stats.missedTargetDates.has(new Date(todayIso).toLocaleDateString('en-CA'))).toBe(true);
  });

  test('treats any practice as goal-met when daily goal is zero', () => {
    const today = new Date();
    const todayIso = today.toISOString();
    const sessions: PracticeSession[] = [
      { id: '5', user_id: 'u1', lesson_id: null, session_type: 'general', duration_mins: 5, started_at: todayIso, completed_at: null },
    ];

    const stats = computeStats(sessions, 0, 0);

    expect(stats.todayMinutes).toBe(5);
    expect(stats.currentStreak).toBe(1);
    expect(stats.longestStreak).toBe(1);
    expect(stats.missedTargetDates.size).toBe(0);
    expect(stats.targetMetDates?.has(new Date(todayIso).toLocaleDateString('en-CA'))).toBe(true);
  });

  test('builds current streak across consecutive goal-met days', () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const sessions: PracticeSession[] = [
      { id: '3', user_id: 'u1', lesson_id: null, session_type: 'general', duration_mins: 25, started_at: yesterday.toISOString(), completed_at: null },
      { id: '4', user_id: 'u1', lesson_id: null, session_type: 'general', duration_mins: 20, started_at: today.toISOString(), completed_at: null },
    ];

    const stats = computeStats(sessions, 0, 20);

    expect(stats.currentStreak).toBe(2);
    expect(stats.longestStreak).toBe(2);
  });
});

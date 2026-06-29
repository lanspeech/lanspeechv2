import type { PracticeSession, UserStats } from './types';

function toDateStr(dateStr: string): string {
  return new Date(dateStr).toISOString().split('T')[0];
}

export function computeStats(
  sessions: PracticeSession[],
  lessonsCompleted: number,
  dailyGoalMins: number
): UserStats {
  const today = new Date().toISOString().split('T')[0];

  // Aggregate minutes per date
  const minutesByDate = new Map<string, number>();
  for (const s of sessions) {
    const d = toDateStr(s.started_at);
    minutesByDate.set(d, (minutesByDate.get(d) ?? 0) + s.duration_mins);
  }

  const practicedDates = new Set(minutesByDate.keys());
  const missedTargetDates = new Set<string>();
  for (const [d, mins] of minutesByDate) {
    if (mins < dailyGoalMins) missedTargetDates.add(d);
  }

  // Current streak — consecutive days ending today (or yesterday if not yet practiced today)
  let currentStreak = 0;
  {
    const start = practicedDates.has(today) ? 0 : 1;
    for (let i = start; i < 365; i++) {
      const d = offsetDate(today, -i);
      if (practicedDates.has(d)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak
  const sortedDates = [...practicedDates].sort();
  let longestStreak = 0;
  let run = 0;
  let prevDate = '';
  for (const d of sortedDates) {
    if (prevDate && diffDays(prevDate, d) === 1) {
      run++;
    } else {
      run = 1;
    }
    if (run > longestStreak) longestStreak = run;
    prevDate = d;
  }

  const totalDays = practicedDates.size;
  const practiceMinutes = sessions.reduce((sum, s) => sum + s.duration_mins, 0);
  const todayMinutes = minutesByDate.get(today) ?? 0;

  return {
    currentStreak,
    longestStreak,
    totalDays,
    lessonsCompleted,
    practiceMinutes,
    todayMinutes,
    dailyGoalMins,
    practicedDates,
    missedTargetDates,
  };
}

function offsetDate(baseIso: string, days: number): string {
  const d = new Date(baseIso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

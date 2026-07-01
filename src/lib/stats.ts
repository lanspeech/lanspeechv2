import type { PracticeSession, UserStats } from './types';

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function toDateStr(dateStr: string): string {
  return formatLocalDate(new Date(dateStr));
}

export function computeStats(
  sessions: PracticeSession[],
  lessonsCompleted: number,
  dailyGoalMins: number
): UserStats {
  const today = formatLocalDate(new Date());

  // Aggregate minutes per date
  const minutesByDate = new Map<string, number>();
  for (const s of sessions) {
    const d = toDateStr(s.started_at);
    minutesByDate.set(d, (minutesByDate.get(d) ?? 0) + s.duration_mins);
  }

  const practicedDates = new Set(minutesByDate.keys());
  const missedTargetDates = new Set<string>();
  const targetMetDates = new Set<string>();
  const hasDailyGoal = dailyGoalMins > 0;

  for (const [d, mins] of minutesByDate) {
    const met = hasDailyGoal ? mins >= dailyGoalMins : mins > 0;
    if (!met) {
      missedTargetDates.add(d);
    } else {
      targetMetDates.add(d);
    }
  }

  // Current streak — consecutive goal-met days ending today (or yesterday if not yet practiced today)
  let currentStreak = 0;
  {
    const startOffset = targetMetDates.has(today) ? 0 : 1;
    for (let i = startOffset; i < 365; i++) {
      const d = offsetDate(today, -i);
      if (targetMetDates.has(d)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak of goal-met days
  const sortedDates = [...minutesByDate.keys()].sort();
  let longestStreak = 0;
  let run = 0;
  let prevDate = '';
  for (const d of sortedDates) {
    if (!targetMetDates.has(d)) {
      run = 0;
    } else if (prevDate && diffDays(prevDate, d) === 1) {
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
    targetMetDates,
  };
}

function offsetDate(baseIso: string, days: number): string {
  const d = parseLocalDate(baseIso);
  d.setDate(d.getDate() + days);
  return formatLocalDate(d);
}

function diffDays(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

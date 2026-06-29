export type SessionType = 'breathing' | 'repeat' | 'read_aloud' | 'speak_freely' | 'general';

export interface Lesson {
  id: string;
  day_number: number;
  title: string;
  description: string;
  duration_mins: number;
  level: string;
  module: string;
  practice_phrase: string | null;
  is_bonus: boolean;
  order_index: number;
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  daily_goal_mins: number;
  avatar_url: string | null;
  specialist_name: string | null;
  specialist_photo_url: string | null;
}

export interface PracticeSession {
  id: string;
  user_id: string;
  lesson_id: string | null;
  session_type: SessionType;
  duration_mins: number;
  started_at: string;
  completed_at: string | null;
}

export interface LessonCompletion {
  id: string;
  user_id: string;
  lesson_id: string;
  completed_at: string;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
  lessonsCompleted: number;
  practiceMinutes: number;
  todayMinutes: number;
  dailyGoalMins: number;
  practicedDates: Set<string>;
  missedTargetDates: Set<string>;
}

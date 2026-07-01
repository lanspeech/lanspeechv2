export type SessionType = 'breathing' | 'repeat' | 'read_aloud' | 'speak_freely' | 'general';

export interface LessonExerciseContent {
  id: string;
  title: string;
  kind: 'breathing' | 'repeat' | 'reading' | 'conversation' | 'reflection';
  description: string;
  instructions?: string[];
  phrases?: string[];
  readText?: string;
  prompt?: string;
  durationHint?: string;
  repeatCount?: number;
  speakText?: string;
}

export interface Lesson {
  id: string;
  slug?: string;
  day_number: number;
  title: string;
  description: string;
  duration_mins: number;
  level: string;
  module: string;
  practice_phrase: string | null;
  is_bonus: boolean;
  order_index: number;
  unit_id?: string;
  unit_slug?: string;
  unit_title?: string;
  unit_theme?: string;
  unit_goal?: string;
  unit_description?: string;
  unit_order_index?: number;
  goal?: string;
  coachTip?: string;
  techniqueReminders?: string[];
  exercises?: LessonExerciseContent[];
  reflection_prompt?: string;
}

export interface Unit {
  id: string;
  slug: string;
  title: string;
  theme: string;
  goal: string;
  description: string;
  order_index: number;
  lessons: Lesson[];
}

export interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  daily_goal_mins: number;
  avatar_url: string | null;
  specialist_name: string | null;
  specialist_photo_url: string | null;
  is_admin?: boolean;
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
export interface LessonProgress {
  lessonId: string;
  exerciseIndex: number;
  updatedAt: string;
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

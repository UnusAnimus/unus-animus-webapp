export enum ExerciseType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  TRUE_FALSE = 'TRUE_FALSE',
  SORTING = 'SORTING',
  CLOZE = 'CLOZE',
  SCENARIO = 'SCENARIO',
  REFLECTION = 'REFLECTION',
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  prompt: string; // The question or scenario
  options?: string[]; // For MC, Sorting, Cloze bank
  correctAnswer?: string | string[] | boolean; // Flexible based on type
  explanation?: string; // Shown after answering
  points: number;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  introText?: string;
  quote?: {
    text: string;
    source: string;
  };
  interpretation?: string;
  exercises: Exercise[];
  requiredScorePercent: number; // e.g., 80
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  units: Unit[];
}

export type Language = 'de' | 'en';
export type Theme = 'light' | 'dark';

export interface PracticeExerciseStats {
  seenCount: number;
  correctCount: number;
  wrongCount: number;
  correctStreak: number;
  lastSeenAt: string | null; // ISO
}

export interface OutcomeEntry {
  date: string; // YYYY-MM-DD
  clarity: number; // 1-10
  reactivity: number; // 1-10
  agency: number; // 1-10
}

export interface ActiveGate {
  type: 'practice';
  message: string;
  createdAt: string; // ISO
}

// User State
export interface UserProgress {
  language: Language;
  theme: Theme;
  hearts: number;
  maxHearts: number;
  streak: number;
  xp: number;
  gems: number;
  lastActiveDate: string | null; // ISO Date string
  completedLessons: Record<
    string,
    {
      score: number;
      completedAt: string;
    }
  >;
  unlockedUnits: string[]; // IDs of unlocked units
  currentUnitId: string;
  currentLessonId: string;
  memoryNotes: string[]; // Summary of user reflections

  // Spaced repetition + anti-repetition for Practice
  practiceStats?: Record<string, PracticeExerciseStats>;

  // Outcome tracking (user-reported)
  outcomeHistory?: OutcomeEntry[];

  // Retention / habit loop
  lastDailyCompletedDate?: string | null; // YYYY-MM-DD

  // Gatekeeping / mastery (null/undefined means no gate)
  activeGate?: ActiveGate | null;
}

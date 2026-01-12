import React from 'react';
import type { Course, Language, UserProgress } from '../types';
import { DailySessionRunner } from '../components/today/DailySessionRunner';

type TodayScreenProps = {
  course: Course;
  userProgress: UserProgress;
  language: Language;
  onExit: () => void;
  onComplete: (payload: {
    xpEarned: number;
    gemsEarned: number;
    outcome: { clarity: number; reactivity: number; agency: number };
    reflection: { prompt: string; text: string; score: number };
    practiceAnswers: Record<string, boolean>;
  }) => void;
};

export function TodayScreen(props: TodayScreenProps) {
  return <DailySessionRunner {...props} />;
}

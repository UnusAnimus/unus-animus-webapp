import React from 'react';
import type { Course, Language, UserProgress } from '../types';
import { PracticeRunner } from '../components/PracticeRunner';

type PracticeScreenProps = {
  course: Course;
  userProgress: UserProgress;
  language: Language;
  onExit: () => void;
  onComplete: (payload: { heartsEarned: number; xpEarned: number; gemsEarned: number; answers: Record<string, boolean> }) => void;
};

export function PracticeScreen(props: PracticeScreenProps) {
  return <PracticeRunner {...props} />;
}

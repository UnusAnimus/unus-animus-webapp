import React from 'react';
import type { Language, Lesson } from '../types';
import { LessonRunner } from '../components/LessonRunner';

type LessonScreenProps = {
  lesson: Lesson;
  userHearts: number;
  language: Language;
  onComplete: (score: number, passed: boolean) => void;
  onHeartLost: () => void;
  onExit: () => void;
};

export function LessonScreen(props: LessonScreenProps) {
  return <LessonRunner {...props} />;
}

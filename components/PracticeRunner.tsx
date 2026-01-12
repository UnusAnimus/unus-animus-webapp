import React, { useMemo, useState } from 'react';
import { Course, ExerciseType, Language, UserProgress } from '../types';
import { CheckCircle, Heart, X } from './ui/Icons';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { IconButton } from './ui/IconButton';
import { ProgressBar } from './ui/ProgressBar';
import { t } from '../utils/translations';
import { generateLocalPracticeExercises } from '../utils/practiceGenerator';

type PracticeCompletePayload = {
  heartsEarned: number;
  xpEarned: number;
  gemsEarned: number;
  answers: Record<string, boolean>; // baseExerciseId -> isCorrect
};

interface PracticeRunnerProps {
  course: Course;
  userProgress: UserProgress;
  language: Language;
  onExit: () => void;
  onComplete: (payload: PracticeCompletePayload) => void;
}

const pickPracticeExercises = (course: Course, progress: UserProgress, language: Language) =>
  generateLocalPracticeExercises(course, progress, language, 7);

const toBooleanAnswer = (answer: unknown, language: Language): boolean | null => {
  if (typeof answer === 'boolean') return answer;
  if (typeof answer !== 'string') return null;
  const normalized = answer.trim().toLowerCase();

  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  if (normalized === 'wahr') return true;
  if (normalized === 'falsch') return false;

  if (language === 'de') {
    if (normalized === 'ja') return true;
    if (normalized === 'nein') return false;
  }

  return null;
};

export const PracticeRunner: React.FC<PracticeRunnerProps> = ({
  course,
  userProgress,
  language,
  onExit,
  onComplete,
}) => {
  const exercises = useMemo(
    () => pickPracticeExercises(course, userProgress, language),
    [course, userProgress, language]
  );

  const [step, setStep] = useState<'intro' | number | 'done'>('intro');
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});

  const baseExerciseId = (id: string) => {
    const marker = '__practice__';
    const idx = id.indexOf(marker);
    return idx >= 0 ? id.slice(0, idx) : id;
  };

  const currentExercise = typeof step === 'number' ? exercises[step] : null;
  const progressPercent = typeof step === 'number' ? ((step + 1) / exercises.length) * 100 : 0;

  const checkAnswer = (answer: string) => {
    if (!currentExercise || feedback) return;

    let isCorrect = false;

    if (currentExercise.type === ExerciseType.TRUE_FALSE) {
      const normalized = toBooleanAnswer(answer, language);
      if (typeof currentExercise.correctAnswer === 'boolean' && normalized !== null) {
        isCorrect = normalized === currentExercise.correctAnswer;
      } else {
        isCorrect = answer === currentExercise.correctAnswer;
      }
    } else {
      isCorrect = answer === currentExercise.correctAnswer;
    }

    if (isCorrect) setCorrectCount(c => c + 1);

    setAnswers(prev => ({
      ...prev,
      [baseExerciseId(currentExercise.id)]: isCorrect,
    }));

    setFeedback({
      isCorrect,
      message:
        currentExercise.explanation || (isCorrect ? t(language, 'correct') : t(language, 'wrong')),
    });
  };

  const goNext = () => {
    setFeedback(null);
    if (typeof step === 'number') {
      if (step < exercises.length - 1) setStep(step + 1);
      else setStep('done');
    }
  };

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-3xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <IconButton onClick={onExit} aria-label="Exit">
              <X className="h-5 w-5" />
            </IconButton>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-bold text-red-600 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-red-300">
              <Heart className="h-4 w-4 fill-current" /> {userProgress.hearts}
            </div>
          </div>

          <Card className="p-6">
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-2">
              {t(language, 'practiceTitle')}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{t(language, 'practiceDesc')}</p>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-700 dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-200">
              {language === 'de'
                ? `Du bekommst 1 Herz, wenn du mindestens ${Math.ceil(exercises.length * 0.6)} von ${exercises.length} richtig beantwortest.`
                : `You earn 1 heart if you answer at least ${Math.ceil(exercises.length * 0.6)} of ${exercises.length} correctly.`}
            </div>

            <div className="mt-6">
              <Button
                onClick={() => setStep(0)}
                disabled={exercises.length === 0}
                variant="accent"
                size="lg"
                className="w-full"
              >
                {t(language, 'practiceStart')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'done') {
    const threshold = Math.ceil(exercises.length * 0.6);
    const earnedHeart = correctCount >= threshold ? 1 : 0;

    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950 px-4 py-10">
        <div className="mx-auto max-w-md">
          <Card className="p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
              <CheckCircle className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {t(language, 'practiceDoneTitle')}
            </h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              {t(language, 'practiceDoneDesc')}
            </p>

            <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-4 text-sm text-slate-700 dark:border-slate-800/70 dark:bg-slate-900/40 dark:text-slate-200 mb-6">
              {language === 'de'
                ? `Richtig: ${correctCount}/${exercises.length} · Herzen: +${earnedHeart}`
                : `Correct: ${correctCount}/${exercises.length} · Hearts: +${earnedHeart}`}
            </div>

            <Button
              onClick={() =>
                onComplete({
                  heartsEarned: earnedHeart,
                  xpEarned: 10,
                  gemsEarned: earnedHeart ? 1 : 0,
                  answers,
                })
              }
              variant="accent"
              className="w-full"
            >
              {t(language, 'practiceContinue')}
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Exercise screen
  if (!currentExercise) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
      <div className="mx-auto max-w-3xl px-4 pt-5">
        <Card className="p-3">
          <div className="flex items-center gap-3">
            <IconButton onClick={onExit} aria-label="Exit">
              <X className="h-5 w-5" />
            </IconButton>
            <div className="flex-1">
              <ProgressBar value={progressPercent} />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm font-bold text-red-600 dark:border-slate-800/70 dark:bg-slate-950/40 dark:text-red-300">
              <Heart className="h-4 w-4 fill-current" /> {userProgress.hearts}
            </div>
          </div>
        </Card>
      </div>

      <main className="mx-auto max-w-3xl px-4 pb-32 pt-5">
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">
            {currentExercise.prompt}
          </h2>

          {(currentExercise.type === ExerciseType.MULTIPLE_CHOICE ||
            currentExercise.type === ExerciseType.SCENARIO ||
            currentExercise.type === ExerciseType.TRUE_FALSE ||
            currentExercise.type === ExerciseType.CLOZE) && (
            <div className="space-y-3">
              {currentExercise.options?.map((opt, idx) => (
                <button
                  key={idx}
                  disabled={!!feedback}
                  onClick={() => checkAnswer(opt)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                    feedback
                      ? opt === currentExercise.correctAnswer
                        ? 'border-hermetic-success bg-green-50 dark:bg-green-900/30 text-hermetic-success dark:text-green-400'
                        : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500'
                      : 'border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </Card>
      </main>

      {feedback && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
          <Card
            className={`mx-auto max-w-3xl animate-slide-up border-2 p-5 shadow-[0_-18px_40px_rgba(0,0,0,0.18)] ${
              feedback.isCorrect ? 'border-emerald-500/40' : 'border-red-500/35'
            }`}
          >
            <p className="text-slate-700 dark:text-slate-200 mb-4">{feedback.message}</p>
            <Button
              onClick={goNext}
              variant={feedback.isCorrect ? 'success' : 'danger'}
              className="w-full"
            >
              {t(language, 'continue')}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};

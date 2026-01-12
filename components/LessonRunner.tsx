import React, { useState } from 'react';
import { Lesson, ExerciseType, Language } from '../types';
import { Heart, X, CheckCircle } from './ui/Icons';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { IconButton } from './ui/IconButton';
import { ProgressBar } from './ui/ProgressBar';
import { evaluateReflection } from '../services/geminiService';
import { t } from '../utils/translations';

const toBooleanAnswer = (answer: unknown, language: Language): boolean | null => {
  if (typeof answer === 'boolean') return answer;
  if (typeof answer !== 'string') return null;
  const normalized = answer.trim().toLowerCase();

  // EN
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;

  // DE
  if (normalized === 'wahr') return true;
  if (normalized === 'falsch') return false;

  // Fallback: accept localized UI text if ever changed
  if (language === 'de') {
    if (normalized === 'ja') return true;
    if (normalized === 'nein') return false;
  }

  return null;
};

interface LessonRunnerProps {
  lesson: Lesson;
  userHearts: number;
  language: Language;
  onComplete: (score: number, passed: boolean) => void;
  onHeartLost: () => void;
  onExit: () => void;
}

export const LessonRunner: React.FC<LessonRunnerProps> = ({ 
  lesson, 
  userHearts,
  language,
  onComplete, 
  onHeartLost, 
  onExit 
}) => {
  const [currentStep, setCurrentStep] = useState(-1); // -1 is Intro
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lessonScore, setLessonScore] = useState(0);

  // Sorting State
  const [selectedSortItems, setSelectedSortItems] = useState<string[]>([]);
  
  // Reflection State
  const [reflectionText, setReflectionText] = useState("");

  const currentExercise = currentStep >= 0 && currentStep < lesson.exercises.length 
    ? lesson.exercises[currentStep] 
    : null;

  const progressPercent = ((currentStep + 1) / (lesson.exercises.length + 1)) * 100;

  const handleNext = () => {
    setFeedback(null);
    setReflectionText("");
    setSelectedSortItems([]);
    
    if (currentStep < lesson.exercises.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // End of lesson
      const maxPossible = lesson.exercises.reduce((acc, ex) => acc + ex.points, 0);
      const percentage = maxPossible > 0 ? (lessonScore / maxPossible) * 100 : 0;
      const passed = percentage >= lesson.requiredScorePercent;
      onComplete(percentage, passed);
    }
  };

  const checkAnswer = async (userAnswer: any) => {
    if (!currentExercise || feedback) return;

    setIsProcessing(true);
    let isCorrect = false;
    let feedbackMsg = "";
    let scoreToAdd = 0;

    switch (currentExercise.type) {
      case ExerciseType.TRUE_FALSE:
        {
          const normalized = toBooleanAnswer(userAnswer, language);
          if (typeof currentExercise.correctAnswer === 'boolean' && normalized !== null) {
            isCorrect = normalized === currentExercise.correctAnswer;
          } else {
            isCorrect = userAnswer === currentExercise.correctAnswer;
          }
          feedbackMsg = currentExercise.explanation || (isCorrect ? t(language, 'correct') : t(language, 'wrong'));
        }
        break;
      case ExerciseType.MULTIPLE_CHOICE:
      case ExerciseType.SCENARIO:
      case ExerciseType.CLOZE:
        isCorrect = userAnswer === currentExercise.correctAnswer;
        feedbackMsg = currentExercise.explanation || (isCorrect ? t(language, 'correct') : t(language, 'wrong'));
        break;
      
      case ExerciseType.SORTING:
        const correctOrder = currentExercise.correctAnswer as string[];
        const userOrder = userAnswer as string[];
        isCorrect = JSON.stringify(correctOrder) === JSON.stringify(userOrder);
        feedbackMsg = currentExercise.explanation || (isCorrect ? t(language, 'correct') : t(language, 'notQuite'));
        break;

      case ExerciseType.REFLECTION:
        // Call Gemini Service
        const analysis = await evaluateReflection(currentExercise.prompt, userAnswer as string, language);
        isCorrect = analysis.isPass;
        feedbackMsg = analysis.feedback;
        // Adjust points based on AI score (0-100% of exercise points)
        if (isCorrect) {
          scoreToAdd = Math.floor(currentExercise.points * (analysis.score / 100));
        }
        break;
    }

    // Default scoring for non-reflection
    if (currentExercise.type !== ExerciseType.REFLECTION && isCorrect) {
      scoreToAdd = currentExercise.points;
    }

    setFeedback({ isCorrect, message: feedbackMsg });
    setIsProcessing(false);

    if (isCorrect) {
      setLessonScore(prev => prev + scoreToAdd);
    } else {
      onHeartLost();
    }
  };

  // Render Logic
  if (userHearts === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-6 text-center dark:from-slate-950 dark:to-slate-950">
        <Card className="w-full max-w-md p-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-600 dark:text-red-300">
            <Heart className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t(language, 'noHeartsTitle')}</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">{t(language, 'noHeartsDesc')}</p>
          <Button onClick={onExit} variant="accent" size="lg" className="w-full">
            {t(language, 'backToPath')}
          </Button>
        </Card>
      </div>
    );
  }

  // INTRO CARD
  if (currentStep === -1) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950">
        <div className="mx-auto flex max-w-3xl flex-col px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <IconButton onClick={onExit} aria-label="Close">
              <X className="h-5 w-5" />
            </IconButton>
          </div>

          <Card className="p-6">
            <h1 className="text-3xl font-serif font-bold text-slate-900 dark:text-white mb-3">{lesson.title}</h1>
            <p className="text-base text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">{lesson.introText}</p>

            {lesson.quote && (
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 dark:border-slate-800/70 dark:bg-slate-900/40">
                <p className="font-serif italic text-lg text-slate-900 dark:text-slate-100 mb-2">"{lesson.quote.text}"</p>
                <span className="text-xs font-bold text-hermetic-accent uppercase tracking-widest">— {lesson.quote.source}</span>
              </div>
            )}

            {lesson.interpretation && (
              <div className="mt-6">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                  {t(language, 'interpretation')}
                </h3>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{lesson.interpretation}</p>
              </div>
            )}

            <div className="mt-6">
              <Button onClick={() => setCurrentStep(0)} variant="success" size="lg" className="w-full">
                {t(language, 'start')}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // EXERCISE RENDERER
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-950 relative">
      {/* Progress Header */}
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
              <Heart className="h-4 w-4 fill-current" /> {userHearts}
            </div>
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-4 pb-32 pt-5">
        {currentExercise && (
          <div className="animate-fade-in">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">{currentExercise.prompt}</h2>

            {/* Multiple Choice / Scenario / TrueFalse */}
            {(currentExercise.type === ExerciseType.MULTIPLE_CHOICE || 
              currentExercise.type === ExerciseType.SCENARIO ||
              currentExercise.type === ExerciseType.TRUE_FALSE ||
              currentExercise.type === ExerciseType.CLOZE) && (
              <div className="space-y-3">
                {currentExercise.options?.map((opt, idx) => {
                  return (
                    <button
                      key={idx}
                      disabled={!!feedback}
                      onClick={() => checkAnswer(opt)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        feedback 
                          ? (opt === currentExercise.correctAnswer 
                              ? "border-hermetic-success bg-green-50 dark:bg-green-900/30 text-hermetic-success dark:text-green-400" 
                              : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500")
                          : "border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:border-gray-300 dark:hover:border-gray-600"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Sorting */}
            {currentExercise.type === ExerciseType.SORTING && (
              <div className="space-y-6">
                <div className="min-h-[60px] p-4 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 flex flex-wrap gap-2">
                  {selectedSortItems.length === 0 && <span className="text-gray-400 dark:text-gray-500 text-sm">{t(language, 'sortInstruction')}</span>}
                  {selectedSortItems.map((item, idx) => (
                    <span key={idx} className="px-3 py-2 bg-hermetic-dark dark:bg-slate-700 text-white rounded-lg text-sm shadow-sm">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                   {currentExercise.options?.filter(opt => !selectedSortItems.includes(opt)).map((opt, idx) => (
                     <button 
                        key={idx}
                        disabled={!!feedback}
                        onClick={() => setSelectedSortItems([...selectedSortItems, opt])}
                        className="px-4 py-2 border-2 border-gray-200 dark:border-slate-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:border-hermetic-accent"
                     >
                       {opt}
                     </button>
                   ))}
                </div>
                {!feedback && (
                   <Button
                     disabled={selectedSortItems.length !== currentExercise.options?.length}
                     onClick={() => checkAnswer(selectedSortItems)}
                     variant="primary"
                     className="w-full"
                   >
                     {t(language, 'check')}
                   </Button>
                )}
              </div>
            )}

            {/* Reflection */}
            {currentExercise.type === ExerciseType.REFLECTION && (
              <div className="space-y-4">
                <textarea
                  disabled={!!feedback}
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder={t(language, 'reflectionPlaceholder')}
                  className="w-full p-4 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-hermetic-accent focus:border-transparent outline-none min-h-[150px]"
                />
                {!feedback && (
                  <Button
                    disabled={reflectionText.length < 10 || isProcessing}
                    onClick={() => checkAnswer(reflectionText)}
                    variant="primary"
                    className="w-full"
                  >
                    {isProcessing ? t(language, 'aiThinking') : t(language, 'submit')}
                  </Button>
                )}
              </div>
            )}

            </Card>
          </div>
        )}
      </div>

      {/* Feedback Sheet */}
      {feedback && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
          <Card
            className={`mx-auto max-w-3xl animate-slide-up border-2 p-5 shadow-[0_-18px_40px_rgba(0,0,0,0.18)] ${
              feedback.isCorrect ? 'border-emerald-500/40' : 'border-red-500/35'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl text-white ${
                  feedback.isCorrect ? 'bg-hermetic-success' : 'bg-hermetic-error'
                }`}
              >
                {feedback.isCorrect ? <CheckCircle className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-lg font-bold ${
                    feedback.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'
                  }`}
                >
                  {feedback.isCorrect ? t(language, 'excellent') : t(language, 'notQuite')}
                </div>
                <p className="mt-1 text-slate-700 dark:text-slate-200">{feedback.message}</p>
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={handleNext}
                variant={feedback.isCorrect ? 'success' : 'danger'}
                className="w-full"
              >
                {t(language, 'continue')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
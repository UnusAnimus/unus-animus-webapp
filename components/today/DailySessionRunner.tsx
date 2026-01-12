import React, { useMemo, useState } from 'react';
import type { Course, Language, Lesson, UserProgress } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { IconButton } from '../ui/IconButton';
import { X } from '../ui/Icons';
import { generateLocalPracticeExercises } from '../../utils/practiceGenerator';
import { evaluateReflection } from '../../services/geminiService';

export type OutcomeCheckin = {
  clarity: number; // 1-10
  reactivity: number; // 1-10 (lower is better, but keep simple)
  agency: number; // 1-10
};

type DailyCompletePayload = {
  xpEarned: number;
  gemsEarned: number;
  outcome: OutcomeCheckin;
  reflection: { prompt: string; text: string; score: number };
  practiceAnswers: Record<string, boolean>;
};

type Props = {
  course: Course;
  userProgress: UserProgress;
  language: Language;
  onExit: () => void;
  onComplete: (payload: DailyCompletePayload) => void;
};

const clampInt = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)));

const findTodayLesson = (course: Course, progress: UserProgress): Lesson => {
  const allLessons = course.units.flatMap(u => u.lessons);
  return allLessons.find(l => l.id === progress.currentLessonId) ?? allLessons[0];
};

const baseExerciseId = (id: string) => {
  const marker = '__practice__';
  const idx = id.indexOf(marker);
  return idx >= 0 ? id.slice(0, idx) : id;
};

export function DailySessionRunner({ course, userProgress, language, onExit, onComplete }: Props) {
  const lesson = useMemo(() => findTodayLesson(course, userProgress), [course, userProgress]);
  const practice = useMemo(
    () => generateLocalPracticeExercises(course, userProgress, language, 3),
    [course, userProgress, language]
  );

  const totalSteps = 5;
  const [step, setStep] = useState(0);

  const [outcome, setOutcome] = useState<OutcomeCheckin>({ clarity: 6, reactivity: 6, agency: 6 });
  const [microDone, setMicroDone] = useState(false);
  const [practiceIdx, setPracticeIdx] = useState(0);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, boolean>>({});

  const [reflectionText, setReflectionText] = useState('');
  const [reflectionBusy, setReflectionBusy] = useState(false);
  const [reflectionScore, setReflectionScore] = useState<number | null>(null);

  const aha = lesson.quote?.text || lesson.interpretation || lesson.introText || lesson.description;
  const microPractice =
    language === 'de'
      ? '60 Sekunden: Atme 4 Sekunden ein, 6 Sekunden aus. Beobachte: Welcher Gedanke erzeugt gerade die Emotion? Benenne ihn.'
      : '60 seconds: inhale 4s, exhale 6s. Observe: which thought creates the emotion? Name it.';

  const reflectionPrompt =
    language === 'de'
      ? 'Was ist heute eine Sache, für die du Verantwortung übernehmen kannst (Gedanke → Gefühl → Handlung)?'
      : 'What is one thing you can take responsibility for today (thought → emotion → action)?';

  const progressPercent = Math.round(((step + 1) / totalSteps) * 100);

  const goNext = () => setStep(s => Math.min(totalSteps - 1, s + 1));

  const updateOutcome = (key: keyof OutcomeCheckin, value: number) => {
    setOutcome(prev => ({ ...prev, [key]: clampInt(value, 1, 10) }));
  };

  const currentPractice = practice[practiceIdx] ?? null;

  const answerPractice = (opt: string) => {
    if (!currentPractice) return;
    const isCorrect = opt === currentPractice.correctAnswer;
    setPracticeAnswers(prev => ({ ...prev, [baseExerciseId(currentPractice.id)]: isCorrect }));

    if (practiceIdx < practice.length - 1) setPracticeIdx(i => i + 1);
    else goNext();
  };

  const submitReflection = async () => {
    const text = reflectionText.trim();
    if (text.length < 10 || reflectionBusy) return;

    setReflectionBusy(true);
    try {
      const fb = await evaluateReflection(reflectionPrompt, text, language);
      setReflectionScore(fb.score);
      goNext();

      onComplete({
        xpEarned: 25,
        gemsEarned: fb.isPass ? 2 : 0,
        outcome,
        reflection: { prompt: reflectionPrompt, text, score: fb.score },
        practiceAnswers
      });
    } finally {
      setReflectionBusy(false);
    }
  };

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
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Heute</div>
          </div>
        </Card>
      </div>

      <main className="mx-auto max-w-3xl px-4 pb-28 pt-5">
        {step === 0 && (
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Check-in</div>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight">
              {language === 'de' ? 'Deine Session für heute' : 'Your session for today'}
            </h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              {language === 'de'
                ? '3–7 Minuten. Eine Erkenntnis, eine Praxis, ein Anker.'
                : '3–7 minutes. One insight, one practice, one anchor.'}
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-sm font-semibold">{language === 'de' ? 'Klarheit' : 'Clarity'}: {outcome.clarity}/10</div>
                <input className="w-full" type="range" min={1} max={10} value={outcome.clarity} onChange={e => updateOutcome('clarity', Number(e.target.value))} />
              </div>
              <div>
                <div className="text-sm font-semibold">{language === 'de' ? 'Reaktivität' : 'Reactivity'}: {outcome.reactivity}/10</div>
                <input className="w-full" type="range" min={1} max={10} value={outcome.reactivity} onChange={e => updateOutcome('reactivity', Number(e.target.value))} />
              </div>
              <div>
                <div className="text-sm font-semibold">{language === 'de' ? 'Handlungsfähigkeit' : 'Agency'}: {outcome.agency}/10</div>
                <input className="w-full" type="range" min={1} max={10} value={outcome.agency} onChange={e => updateOutcome('agency', Number(e.target.value))} />
              </div>
            </div>

            <Button className="mt-6 w-full" variant="accent" onClick={goNext}>
              {language === 'de' ? 'Starten' : 'Start'}
            </Button>
          </Card>
        )}

        {step === 1 && (
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {language === 'de' ? 'Erkenntnis' : 'Insight'}
            </div>
            <h2 className="mt-2 text-xl font-semibold">{lesson.title}</h2>
            <p className="mt-4 text-slate-700 dark:text-slate-200 leading-relaxed">{aha}</p>
            <Button className="mt-6 w-full" variant="accent" onClick={goNext}>
              {language === 'de' ? 'Weiter' : 'Continue'}
            </Button>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {language === 'de' ? 'Mikro-Praxis' : 'Micro practice'}
            </div>
            <p className="mt-4 text-slate-700 dark:text-slate-200 leading-relaxed">{microPractice}</p>
            <Button className="mt-6 w-full" variant={microDone ? 'accent' : 'secondary'} onClick={() => setMicroDone(true)}>
              {microDone ? (language === 'de' ? 'Erledigt' : 'Done') : (language === 'de' ? 'Als erledigt markieren' : 'Mark as done')}
            </Button>
            <Button className="mt-3 w-full" variant="accent" onClick={goNext} disabled={!microDone}>
              {language === 'de' ? 'Weiter' : 'Continue'}
            </Button>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {language === 'de' ? 'Practice (3 Fragen)' : 'Practice (3 questions)'}
            </div>

            {!currentPractice ? (
              <p className="mt-4 text-slate-600 dark:text-slate-300">
                {language === 'de' ? 'Keine Fragen verfügbar.' : 'No questions available.'}
              </p>
            ) : (
              <>
                <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  {practiceIdx + 1}/{practice.length}
                </div>
                <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{currentPractice.prompt}</h3>
                <div className="mt-4 space-y-3">
                  {currentPractice.options?.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => answerPractice(opt)}
                      className="w-full rounded-xl border-2 border-slate-200 p-4 text-left transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-900/40"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </>
            )}
          </Card>
        )}

        {step === 4 && (
          <Card className="p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {language === 'de' ? 'Reflexionsanker' : 'Reflection anchor'}
            </div>
            <h3 className="mt-2 text-lg font-semibold">{reflectionPrompt}</h3>
            <textarea
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white p-4 text-slate-900 outline-none focus:ring-2 focus:ring-slate-300 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              rows={5}
              value={reflectionText}
              onChange={e => setReflectionText(e.target.value)}
              placeholder={language === 'de' ? 'Schreibe 2–5 Sätze…' : 'Write 2–5 sentences…'}
            />

            <Button
              className="mt-4 w-full"
              variant="accent"
              onClick={submitReflection}
              disabled={reflectionBusy || reflectionText.trim().length < 10}
            >
              {reflectionBusy ? (language === 'de' ? 'Bewertung…' : 'Evaluating…') : (language === 'de' ? 'Abschließen' : 'Finish')}
            </Button>

            {reflectionScore !== null && (
              <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                {language === 'de' ? `Score: ${reflectionScore}` : `Score: ${reflectionScore}`}
              </div>
            )}
          </Card>
        )}
      </main>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import type { Course, Language, UserProgress } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/ProgressBar';
import { PathMap } from '../components/PathMap';
import { Badge } from '../components/ui/Badge';
import { ChevronRight, Flame, Gem, Heart } from '../components/ui/Icons';
import { t } from '../utils/translations';
import { getAiStatus } from '../services/aiStatus';

type HomeScreenProps = {
  course: Course;
  userProgress: UserProgress;
  language: Language;
  onStartLesson: (unitId: string, lessonId: string) => void;
  onStartToday: () => void;
  onStartPractice: () => void;
};

function findUnitIdForLesson(course: Course, lessonId: string): string | null {
  for (const unit of course.units) {
    if (unit.lessons.some(l => l.id === lessonId)) return unit.id;
  }
  return null;
}

function clamp01to10(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(10, Math.round(value)));
}

function MiniBars({ values }: { values: number[] }) {
  return (
    <div className="flex h-10 items-end gap-1">
      {values.map((v, idx) => {
        const heightPct = (clamp01to10(v) / 10) * 100;
        return (
          <div
            key={idx}
            className="w-3 rounded-md bg-hermetic-accent/70 dark:bg-hermetic-accent/60"
            style={{ height: `${heightPct}%` }}
            title={String(v)}
          />
        );
      })}
    </div>
  );
}

export function HomeScreen({
  course,
  userProgress,
  language,
  onStartLesson,
  onStartToday,
  onStartPractice
}: HomeScreenProps) {
  const currentLesson = useMemo(() => {
    const lessonId = userProgress.currentLessonId;
    for (const unit of course.units) {
      const lesson = unit.lessons.find(l => l.id === lessonId);
      if (lesson) return { unitId: unit.id, lesson };
    }
    return null;
  }, [course.units, userProgress.currentLessonId]);

  const totalLessons = course.units.reduce((acc, u) => acc + u.lessons.length, 0);
  const completedCount = Object.keys(userProgress.completedLessons || {}).length;
  const completionPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const continueUnitId = currentLesson?.unitId ?? findUnitIdForLesson(course, userProgress.currentLessonId);

  const [aiProviderLabel, setAiProviderLabel] = useState<string>(() => (language === 'de' ? 'AI: —' : 'AI: —'));
  const [aiProviderTone, setAiProviderTone] = useState<'ok' | 'warn' | 'bad'>(() => 'warn');

  useEffect(() => {
    let isMounted = true;
    getAiStatus(language)
      .then((status) => {
        if (!isMounted) return;
        if (status.provider === 'openai') {
          setAiProviderLabel(language === 'de' ? 'AI: OpenAI aktiv' : 'AI: OpenAI active');
          setAiProviderTone('ok');
        } else if (status.provider === 'gemini') {
          setAiProviderLabel(language === 'de' ? 'AI: Gemini aktiv' : 'AI: Gemini active');
          setAiProviderTone('ok');
        } else if (status.provider === 'none') {
          setAiProviderLabel(language === 'de' ? 'AI: Simulation' : 'AI: Simulation');
          setAiProviderTone('warn');
        } else {
          setAiProviderLabel(language === 'de' ? 'AI: Offline' : 'AI: Offline');
          setAiProviderTone('bad');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setAiProviderLabel(language === 'de' ? 'AI: Offline' : 'AI: Offline');
        setAiProviderTone('bad');
      });
    return () => {
      isMounted = false;
    };
  }, [language]);

  const gate = userProgress.activeGate?.type === 'practice' ? userProgress.activeGate : null;
  const recentOutcomes = (userProgress.outcomeHistory || [])
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
  const last7 = recentOutcomes.slice(-7);
  const last7Clarity = last7.map(e => clamp01to10(e.clarity));
  const last7Reactivity = last7.map(e => clamp01to10(e.reactivity));
  const last7Agency = last7.map(e => clamp01to10(e.agency));

  const avg = (values: number[]) => {
    if (!values.length) return null;
    return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  };

  const avgClarity = avg(last7Clarity);
  const avgReactivity = avg(last7Reactivity);
  const avgAgency = avg(last7Agency);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {course.title}
          </div>
          <h1 className="mt-1 font-serif text-3xl font-bold tracking-tight">{t(language, 'path')}</h1>
        </div>
        <Badge variant="accent">{completionPercent}%</Badge>
      </div>

      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {language === 'de' ? 'Heute' : 'Today'}
            </div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {language === 'de'
                ? '3–7 Minuten: Erkenntnis · Praxis · Reflexion'
                : '3–7 minutes: insight · practice · reflection'}
            </div>
            <div
              className={
                'mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ' +
                (aiProviderTone === 'ok'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200'
                  : aiProviderTone === 'warn'
                    ? 'bg-amber-500/15 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200'
                    : 'bg-rose-500/15 text-rose-700 dark:bg-rose-400/15 dark:text-rose-200')
              }
            >
              {aiProviderLabel}
            </div>
          </div>
          <Button variant="accent" onClick={onStartToday}>
            {language === 'de' ? 'Session starten' : 'Start session'}
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </Card>

      {gate && (
        <Card className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                {language === 'de' ? 'Meisterschaft' : 'Mastery'}
              </div>
              <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">{gate.message}</div>
            </div>
            <Button variant="accent" onClick={onStartPractice}>
              {language === 'de' ? 'Practice starten' : 'Start practice'}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {language === 'de' ? 'Dein Trend (7 Tage)' : 'Your trend (7 days)'}
            </div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {language === 'de'
                ? 'Klarheit · Reaktivität · Selbstwirksamkeit (1–10)'
                : 'Clarity · Reactivity · Agency (1–10)'}
            </div>
          </div>
          <Badge variant="soft">
            {last7.length ? (language === 'de' ? `${last7.length} Einträge` : `${last7.length} entries`) : (language === 'de' ? 'Noch leer' : 'Empty')}
          </Badge>
        </div>

        {last7.length ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>{language === 'de' ? 'Klarheit' : 'Clarity'}</span>
                <span className="text-slate-500 dark:text-slate-400">Ø {avgClarity ?? '—'}</span>
              </div>
              <div className="mt-2"><MiniBars values={last7Clarity} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>{language === 'de' ? 'Reaktivität' : 'Reactivity'}</span>
                <span className="text-slate-500 dark:text-slate-400">Ø {avgReactivity ?? '—'}</span>
              </div>
              <div className="mt-2"><MiniBars values={last7Reactivity} /></div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                <span>{language === 'de' ? 'Selbstwirksamkeit' : 'Agency'}</span>
                <span className="text-slate-500 dark:text-slate-400">Ø {avgAgency ?? '—'}</span>
              </div>
              <div className="mt-2"><MiniBars values={last7Agency} /></div>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            {language === 'de'
              ? 'Starte eine Heute-Session, um deinen ersten Eintrag zu erzeugen.'
              : 'Start a Today session to generate your first entry.'}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              {language === 'de' ? 'Weiterlernen' : 'Continue'}
            </div>
            <div className="mt-1 truncate text-xl font-bold">
              {currentLesson?.lesson.title ?? course.units[0]?.lessons[0]?.title ?? '—'}
            </div>
            <div className="mt-3">
              <ProgressBar value={completionPercent} />
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {language === 'de'
                    ? `${completedCount} von ${totalLessons} Lektionen abgeschlossen`
                    : `${completedCount} of ${totalLessons} lessons completed`}
                </span>
                <span>XP {userProgress.xp}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden flex-col gap-2 sm:flex">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <Heart className="h-4 w-4 text-red-500" /> {userProgress.hearts}/{userProgress.maxHearts}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <Flame className="h-4 w-4 text-orange-500" /> {userProgress.streak}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
                <Gem className="h-4 w-4 text-blue-500" /> {userProgress.gems}
              </div>
            </div>

            <Button
              variant="accent"
              size="lg"
              disabled={!continueUnitId || !userProgress.currentLessonId}
              onClick={() => {
                if (!continueUnitId) return;
                onStartLesson(continueUnitId, userProgress.currentLessonId);
              }}
            >
              {language === 'de' ? 'Fortsetzen' : 'Continue'}
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {language === 'de' ? 'Dein Pfad' : 'Your Path'}
            </div>
            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {course.description}
            </div>
          </div>
        </div>

        <PathMap course={course} userProgress={userProgress} onStartLesson={onStartLesson} />
      </Card>
    </div>
  );
}

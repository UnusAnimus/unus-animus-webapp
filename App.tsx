import React, { useState, useEffect } from 'react';
import { COURSES } from './constants';
import { loadProgress, saveProgress } from './utils/storage';
import { UserProgress } from './types';
import { AppShell } from './components/layout/AppShell';
import type { TabKey } from './components/layout/BottomTabs';
import { HomeScreen } from './screens/HomeScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LessonScreen } from './screens/LessonScreen';
import { PracticeScreen } from './screens/PracticeScreen';
import { TodayScreen } from './screens/TodayScreen';
import { AuthScreen } from './screens/AuthScreen';
import { t } from './utils/translations';
import type { AuthUser } from './types';
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
  setCachedAuthUser,
  getCachedAuthUser,
} from './utils/authStorage';
import { verifyAuthToken } from './services/authProxy';

enum Screen {
  HOME = 'HOME',
  LESSON = 'LESSON',
  PROFILE = 'PROFILE',
  PRACTICE = 'PRACTICE',
  TODAY = 'TODAY',
}

const screenToTab = (screen: Screen): TabKey => {
  switch (screen) {
    case Screen.PRACTICE:
      return 'practice';
    case Screen.PROFILE:
      return 'profile';
    case Screen.HOME:
    case Screen.TODAY:
    default:
      return 'home';
  }
};

const tabToScreen = (tab: TabKey): Screen => {
  switch (tab) {
    case 'practice':
      return Screen.PRACTICE;
    case 'profile':
      return Screen.PROFILE;
    case 'home':
    default:
      return Screen.HOME;
  }
};

export default function App() {
  const [authStatus, setAuthStatus] = useState<'checking' | 'anon' | 'authed'>('checking');
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getCachedAuthUser());
  const [authExp, setAuthExp] = useState<number | undefined>(undefined);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authWorking, setAuthWorking] = useState(false);

  const [screen, setScreen] = useState<Screen>(Screen.HOME);
  const [userProgress, setUserProgress] = useState<UserProgress>(loadProgress());
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [queuedLessonId, setQueuedLessonId] = useState<string | null>(null);
  const [gateModal, setGateModal] = useState<{
    open: boolean;
    unitId: string | null;
    lessonId: string | null;
  }>({ open: false, unitId: null, lessonId: null });

  // Sync effect for storage
  useEffect(() => {
    saveProgress(userProgress);
  }, [userProgress]);

  const logout = () => {
    clearAuthToken();
    setAuthUser(null);
    setAuthExp(undefined);
    setAuthStatus('anon');
  };

  const verifyAndSetAuth = async (token: string) => {
    setAuthWorking(true);
    setAuthError(null);
    try {
      const { user, exp } = await verifyAuthToken(token);
      setAuthUser(user);
      setCachedAuthUser(user);
      setAuthExp(exp);
      setAuthStatus('authed');
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'auth_failed';
      clearAuthToken();
      setAuthUser(null);
      setAuthExp(undefined);
      setAuthStatus('anon');
      setAuthError(message);
    } finally {
      setAuthWorking(false);
    }
  };

  // Initial auth boot (token from URL or local storage)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    if (urlToken) {
      setAuthToken(urlToken);
      params.delete('token');
      const qs = params.toString();
      const nextUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', nextUrl);
    }

    const token = urlToken ?? getAuthToken();
    if (token) {
      void verifyAndSetAuth(token);
    } else {
      setAuthStatus('anon');
    }
  }, []);

  // Token refresh / re-verify shortly before exp
  useEffect(() => {
    if (authStatus !== 'authed') return;
    if (!authExp) return;

    const msUntilReverify = authExp * 1000 - Date.now() - 60_000;
    if (msUntilReverify <= 0) {
      logout();
      return;
    }

    const id = window.setTimeout(() => {
      const token = getAuthToken();
      if (token) void verifyAndSetAuth(token);
    }, msUntilReverify);

    return () => window.clearTimeout(id);
  }, [authStatus, authExp]);

  // Sync effect for Dark Mode
  useEffect(() => {
    if (userProgress.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [userProgress.theme]);

  // Derived state for current language content
  const currentLanguage = userProgress.language || 'de';
  const currentCourse = COURSES[currentLanguage];

  const mergePracticeStats = (
    existing: NonNullable<UserProgress['practiceStats']>,
    answers: Record<string, boolean>
  ): NonNullable<UserProgress['practiceStats']> => {
    const now = new Date().toISOString();
    const next = { ...existing };

    for (const [exerciseId, isCorrect] of Object.entries(answers)) {
      const prev = next[exerciseId] ?? {
        seenCount: 0,
        correctCount: 0,
        wrongCount: 0,
        correctStreak: 0,
        lastSeenAt: null,
      };

      next[exerciseId] = {
        seenCount: prev.seenCount + 1,
        correctCount: prev.correctCount + (isCorrect ? 1 : 0),
        wrongCount: prev.wrongCount + (isCorrect ? 0 : 1),
        correctStreak: isCorrect ? prev.correctStreak + 1 : 0,
        lastSeenAt: now,
      };
    }

    return next;
  };

  const isGateSatisfiedByPractice = (answers: Record<string, boolean>): boolean => {
    const values = Object.values(answers);
    if (values.length < 5) return false;
    const correct = values.filter(Boolean).length;
    return correct / values.length >= 0.7;
  };

  const handleStartLesson = (unitId: string, lessonId: string) => {
    // Gatekeeping: if the user is required to practice, route them into Practice first.
    if (userProgress.activeGate?.type === 'practice') {
      setGateModal({ open: true, unitId, lessonId });
      return;
    }

    if (userProgress.hearts > 0) {
      setActiveLessonId(lessonId);
      setScreen(Screen.LESSON);
    } else {
      // Guide user into practice rather than hard-blocking.
      setScreen(Screen.PRACTICE);
    }
  };

  const getLessonIndex = (lessonId: string): number => {
    const orderedLessons = currentCourse.units
      .slice()
      .sort((a, b) => a.order - b.order)
      .flatMap(u => u.lessons);
    return orderedLessons.findIndex(l => l.id === lessonId);
  };

  const getNextLessonAfter = (
    lessonId: string,
    completed: Record<string, unknown>
  ): string | null => {
    const orderedUnits = currentCourse.units.slice().sort((a, b) => a.order - b.order);
    const orderedLessons = orderedUnits.flatMap(u =>
      u.lessons.map(l => ({ unitId: u.id, lesson: l }))
    );
    const startIdx = orderedLessons.findIndex(x => x.lesson.id === lessonId);

    for (let i = Math.max(0, startIdx + 1); i < orderedLessons.length; i++) {
      const candidate = orderedLessons[i];
      if (!completed[candidate.lesson.id]) return candidate.lesson.id;
    }
    return null;
  };

  const handleLessonComplete = (scorePercent: number, passed: boolean) => {
    if (!activeLessonId) return;

    if (passed) {
      setUserProgress(prev => {
        const newCompleted = {
          ...prev.completedLessons,
          [activeLessonId]: { score: scorePercent, completedAt: new Date().toISOString() },
        };

        // Determine next lesson without regressing progress when replaying older lessons.
        const nextCandidate =
          getNextLessonAfter(activeLessonId, newCompleted) ?? prev.currentLessonId;
        const prevIdx = getLessonIndex(prev.currentLessonId);
        const nextIdx = getLessonIndex(nextCandidate);
        const safeNextLessonId =
          nextIdx >= 0 && prevIdx >= 0 && nextIdx < prevIdx ? prev.currentLessonId : nextCandidate;

        const needsPractice = scorePercent < 90;

        return {
          ...prev,
          xp: prev.xp + 15,
          gems: prev.gems + (scorePercent === 100 ? 5 : 2),
          completedLessons: newCompleted,
          currentLessonId: safeNextLessonId,
          activeGate: needsPractice
            ? {
                type: 'practice',
                message:
                  currentLanguage === 'de'
                    ? 'Meisterschaft: Erst eine kurze Practice-Session (≥70% richtig), dann geht’s weiter.'
                    : 'Mastery: Complete a short practice session (≥70% correct) to continue.',
                createdAt: new Date().toISOString(),
              }
            : null,
        };
      });
      setScreen(Screen.HOME);
    } else {
      // Failed - simple restart logic for now
      alert(t(currentLanguage, 'lessonFailed'));
      setScreen(Screen.HOME);
    }
    setActiveLessonId(null);
  };

  const handleHeartLost = () => {
    setUserProgress(prev => ({ ...prev, hearts: Math.max(0, prev.hearts - 1) }));
  };

  const toggleLanguage = () => {
    setUserProgress(prev => ({
      ...prev,
      language: prev.language === 'en' ? 'de' : 'en',
    }));
  };

  const toggleTheme = () => {
    setUserProgress(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  // Find active lesson object
  const activeLesson = activeLessonId
    ? currentCourse.units.flatMap(u => u.lessons).find(l => l.id === activeLessonId)
    : null;

  // --- VIEWS ---

  if (authStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-4 py-10 text-slate-900 dark:from-slate-950 dark:to-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-md text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Checking access
          </div>
          <div className="mt-2 font-serif text-3xl font-bold">Kybalion Path</div>
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">Authentifizierung…</div>
        </div>
      </div>
    );
  }

  if (authStatus === 'anon') {
    return (
      <AuthScreen
        error={authError}
        isWorking={authWorking}
        onSubmitToken={token => {
          setAuthToken(token);
          void verifyAndSetAuth(token);
        }}
      />
    );
  }

  if (screen === Screen.LESSON && activeLesson) {
    return (
      <LessonScreen
        lesson={activeLesson}
        userHearts={userProgress.hearts}
        language={currentLanguage}
        onComplete={handleLessonComplete}
        onHeartLost={handleHeartLost}
        onExit={() => setScreen(Screen.HOME)}
      />
    );
  }

  if (screen === Screen.PRACTICE) {
    return (
      <PracticeScreen
        course={currentCourse}
        userProgress={userProgress}
        language={currentLanguage}
        onExit={() => setScreen(Screen.HOME)}
        onComplete={({ heartsEarned, xpEarned, gemsEarned, answers }) => {
          setUserProgress(prev => {
            const gateActive = prev.activeGate?.type === 'practice';
            const gateSatisfied = gateActive ? isGateSatisfiedByPractice(answers) : false;
            return {
              ...prev,
              hearts: Math.min(prev.maxHearts, prev.hearts + heartsEarned),
              xp: prev.xp + xpEarned,
              gems: prev.gems + gemsEarned,
              practiceStats: mergePracticeStats(prev.practiceStats || {}, answers),
              activeGate: gateSatisfied ? null : prev.activeGate,
            };
          });

          // If a lesson was queued behind the gate, continue into it when gate is satisfied.
          if (
            userProgress.activeGate?.type === 'practice' &&
            isGateSatisfiedByPractice(answers) &&
            queuedLessonId
          ) {
            setActiveLessonId(queuedLessonId);
            setQueuedLessonId(null);
            setScreen(Screen.LESSON);
            return;
          }

          setScreen(Screen.HOME);
        }}
      />
    );
  }

  if (screen === Screen.TODAY) {
    return (
      <TodayScreen
        course={currentCourse}
        userProgress={userProgress}
        language={currentLanguage}
        onExit={() => setScreen(Screen.HOME)}
        onComplete={({ xpEarned, gemsEarned, outcome, reflection, practiceAnswers }) => {
          const today = new Date().toISOString().slice(0, 10);
          setUserProgress(prev => ({
            ...prev,
            xp: prev.xp + xpEarned,
            gems: prev.gems + gemsEarned,
            lastDailyCompletedDate: today,
            outcomeHistory: [
              ...(prev.outcomeHistory || []).filter(e => e.date !== today),
              { date: today, ...outcome },
            ].slice(-60),
            practiceStats: mergePracticeStats(prev.practiceStats || {}, practiceAnswers),
            memoryNotes: [
              ...(prev.memoryNotes || []).slice(-24),
              `${today}: ${reflection.text}`,
            ].slice(-25),
          }));

          setScreen(Screen.HOME);
        }}
      />
    );
  }

  const activeTab: TabKey = screenToTab(screen);

  return (
    <>
      <AppShell
        activeTab={activeTab}
        onTabChange={tab => setScreen(tabToScreen(tab))}
        userProgress={userProgress}
        language={currentLanguage}
        labels={{
          home: t(currentLanguage, 'path'),
          practice: t(currentLanguage, 'practice'),
          profile: t(currentLanguage, 'profile'),
        }}
      >
        {screen === Screen.HOME && (
          <HomeScreen
            course={currentCourse}
            userProgress={userProgress}
            language={currentLanguage}
            onStartLesson={handleStartLesson}
            onStartToday={() => setScreen(Screen.TODAY)}
            onStartPractice={() => setScreen(Screen.PRACTICE)}
          />
        )}

        {screen === Screen.PROFILE && (
          <ProfileScreen
            userProgress={userProgress}
            language={currentLanguage}
            onToggleLanguage={toggleLanguage}
            onToggleTheme={toggleTheme}
            onReset={() => {
              localStorage.clear();
              window.location.reload();
            }}
            authUser={authUser}
            onLogout={logout}
          />
        )}
      </AppShell>

      {gateModal.open && userProgress.activeGate?.type === 'practice' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl ring-1 ring-black/5 dark:bg-slate-900 dark:ring-white/10">
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {currentLanguage === 'de' ? 'Meisterschaft-Sperre' : 'Mastery Gate'}
            </div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {userProgress.activeGate.message}
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-white/5"
                onClick={() => setGateModal({ open: false, unitId: null, lessonId: null })}
              >
                {currentLanguage === 'de' ? 'Später' : 'Not now'}
              </button>
              <button
                className="inline-flex items-center justify-center rounded-xl bg-hermetic-accent px-4 py-2 text-sm font-semibold text-white shadow-sm hover:brightness-110"
                onClick={() => {
                  if (gateModal.lessonId) setQueuedLessonId(gateModal.lessonId);
                  setGateModal({ open: false, unitId: null, lessonId: null });
                  setScreen(Screen.PRACTICE);
                }}
              >
                {currentLanguage === 'de' ? 'Practice starten' : 'Start practice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

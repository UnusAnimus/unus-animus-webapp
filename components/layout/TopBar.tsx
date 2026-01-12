import React from 'react';
import { Heart, Flame, Gem } from '../ui/Icons';
import { StatPill } from '../ui/StatPill';
import { Language, UserProgress } from '../../types';
import { t } from '../../utils/translations';

type TopBarProps = {
  userProgress: UserProgress;
  language: Language;
};

export function TopBar({ userProgress, language }: TopBarProps) {
  const heartsLabel = language === 'de' ? 'Herzen' : 'Hearts';
  const streakLabel = language === 'de' ? 'Serie' : 'Streak';
  const gemsLabel = language === 'de' ? 'Edelsteine' : 'Gems';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            {t(language, 'path')}
          </div>
          <div className="truncate font-serif text-lg font-bold text-slate-900 dark:text-slate-100">
            Kybalion Path
          </div>
        </div>

        <div className="hidden items-center gap-3 sm:flex">
          <StatPill
            label={heartsLabel}
            value={userProgress.hearts}
            tone="danger"
            icon={<Heart className="h-5 w-5 fill-current" />}
          />
          <StatPill
            label={streakLabel}
            value={userProgress.streak}
            tone="accent"
            icon={<Flame className="h-5 w-5" />}
          />
          <StatPill
            label={gemsLabel}
            value={userProgress.gems}
            tone="info"
            icon={<Gem className="h-5 w-5" />}
          />
        </div>
      </div>
    </header>
  );
}

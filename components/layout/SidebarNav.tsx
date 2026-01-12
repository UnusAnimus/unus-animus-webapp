import React from 'react';
import { BookOpen, Home, User } from '../ui/Icons';
import { cn } from '../../utils/cn';
import type { TabKey } from './BottomTabs';

type SidebarNavProps = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  labels: {
    home: string;
    practice: string;
    profile: string;
  };
};

export function SidebarNav({ active, onChange, labels }: SidebarNavProps) {
  const itemBase =
    'flex items-center gap-3 rounded-2xl px-3 py-2 font-semibold transition-colors';

  return (
    <aside className="hidden w-64 flex-shrink-0 px-4 py-5 sm:block">
      <div className="rounded-3xl border border-slate-200/70 bg-white/70 p-3 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/40">
        <div className="px-3 pb-3 pt-2">
          <div className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Navigation
          </div>
        </div>

        <button
          className={cn(
            itemBase,
            active === 'home'
              ? 'bg-hermetic-accent/15 text-hermetic-accent'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900/60'
          )}
          onClick={() => onChange('home')}
        >
          <Home className="h-5 w-5" />
          {labels.home}
        </button>

        <button
          className={cn(
            itemBase,
            active === 'practice'
              ? 'bg-hermetic-accent/15 text-hermetic-accent'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900/60'
          )}
          onClick={() => onChange('practice')}
        >
          <BookOpen className="h-5 w-5" />
          {labels.practice}
        </button>

        <button
          className={cn(
            itemBase,
            active === 'profile'
              ? 'bg-hermetic-accent/15 text-hermetic-accent'
              : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900/60'
          )}
          onClick={() => onChange('profile')}
        >
          <User className="h-5 w-5" />
          {labels.profile}
        </button>
      </div>
    </aside>
  );
}

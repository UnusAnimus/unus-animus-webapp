import React from 'react';
import { BookOpen, Home, User } from '../ui/Icons';
import { cn } from '../../utils/cn';

export type TabKey = 'home' | 'practice' | 'profile';

type BottomTabsProps = {
  active: TabKey;
  onChange: (tab: TabKey) => void;
  labels: {
    home: string;
    practice: string;
    profile: string;
  };
};

export function BottomTabs({ active, onChange, labels }: BottomTabsProps) {
  const itemBase =
    'flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold transition-colors';

  const activeCls = 'text-hermetic-accent';
  const inactiveCls = 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200';

  return (
    <nav className="pb-safe sticky bottom-0 z-30 border-t border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/60 sm:hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-2">
        <button
          className={cn(itemBase, active === 'home' ? activeCls : inactiveCls)}
          onClick={() => onChange('home')}
        >
          <Home className="h-6 w-6" />
          <span>{labels.home}</span>
        </button>

        <button
          className={cn(itemBase, active === 'practice' ? activeCls : inactiveCls)}
          onClick={() => onChange('practice')}
        >
          <BookOpen className="h-6 w-6" />
          <span>{labels.practice}</span>
        </button>

        <button
          className={cn(itemBase, active === 'profile' ? activeCls : inactiveCls)}
          onClick={() => onChange('profile')}
        >
          <User className="h-6 w-6" />
          <span>{labels.profile}</span>
        </button>
      </div>
    </nav>
  );
}

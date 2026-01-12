import React from 'react';
import { cn } from '../../utils/cn';

type StatPillProps = {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  tone?: 'neutral' | 'accent' | 'danger' | 'info';
  className?: string;
};

export function StatPill({ icon, label, value, tone = 'neutral', className }: StatPillProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur',
        'bg-white/80 border-slate-200/70 dark:bg-slate-900/60 dark:border-slate-800/70',
        className
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl border',
          'bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200',
          tone === 'accent' && 'bg-hermetic-accent/15 border-hermetic-accent/30 text-hermetic-accent',
          tone === 'danger' && 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-300',
          tone === 'info' && 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-300'
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{value}</div>
      </div>
    </div>
  );
}

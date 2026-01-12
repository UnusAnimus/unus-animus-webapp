import React from 'react';
import { cn } from '../../utils/cn';

type ProgressBarProps = {
  value: number; // 0-100
  className?: string;
};

export function ProgressBar({ value, className }: ProgressBarProps) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div
      className={cn(
        'h-2 w-full rounded-full bg-slate-200/70 dark:bg-slate-800/70 overflow-hidden',
        className
      )}
      role="progressbar"
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-hermetic-success to-emerald-400 transition-all duration-500"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

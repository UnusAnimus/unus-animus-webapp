import React from 'react';
import { cn } from '../../utils/cn';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'muted';
};

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border shadow-sm backdrop-blur transition-colors',
        variant === 'default' &&
          'bg-white/90 border-slate-200/70 text-slate-900 dark:bg-slate-900/60 dark:border-slate-800/70 dark:text-slate-100',
        variant === 'muted' &&
          'bg-slate-50/80 border-slate-200/70 text-slate-900 dark:bg-slate-900/40 dark:border-slate-800/70 dark:text-slate-100',
        className
      )}
      {...props}
    />
  );
}

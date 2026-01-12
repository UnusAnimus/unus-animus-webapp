import React from 'react';
import { cn } from '../../utils/cn';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'accent' | 'success' | 'danger';
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide',
        variant === 'default' &&
          'bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200',
        variant === 'accent' && 'bg-hermetic-accent/20 text-hermetic-accent',
        variant === 'success' && 'bg-green-500/15 text-green-700 dark:text-green-300',
        variant === 'danger' && 'bg-red-500/15 text-red-700 dark:text-red-300',
        className
      )}
      {...props}
    />
  );
}

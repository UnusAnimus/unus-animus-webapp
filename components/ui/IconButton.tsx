import React from 'react';
import { cn } from '../../utils/cn';

type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'sm' | 'md';
};

export function IconButton({ className, size = 'md', type, ...props }: IconButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'inline-flex items-center justify-center rounded-xl border shadow-sm transition-colors',
        'bg-white/80 border-slate-200/70 text-slate-700 hover:bg-white dark:bg-slate-900/60 dark:border-slate-800/70 dark:text-slate-200 dark:hover:bg-slate-900',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hermetic-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
        size === 'sm' && 'h-9 w-9',
        size === 'md' && 'h-10 w-10',
        className
      )}
      {...props}
    />
  );
}

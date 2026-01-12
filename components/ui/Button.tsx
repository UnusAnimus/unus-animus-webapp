import React from 'react';
import { cn } from '../../utils/cn';

type ButtonVariant = 'primary' | 'accent' | 'success' | 'danger' | 'ghost' | 'soft';
type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hermetic-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950',
        'disabled:pointer-events-none disabled:opacity-50',
        size === 'sm' && 'h-9 px-3 text-sm',
        size === 'md' && 'h-11 px-4 text-sm',
        size === 'lg' && 'h-12 px-5 text-base',
        variant === 'primary' &&
          'bg-hermetic-dark text-white hover:bg-[#0f1024] dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white',
        variant === 'accent' && 'bg-hermetic-accent text-slate-950 hover:bg-[#b49356]',
        variant === 'success' && 'bg-hermetic-success text-white hover:bg-green-700',
        variant === 'danger' && 'bg-hermetic-error text-white hover:bg-red-700',
        variant === 'ghost' &&
          'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/60',
        variant === 'soft' &&
          'bg-slate-100/80 text-slate-900 hover:bg-slate-200 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:bg-slate-800',
        className
      )}
      {...props}
    />
  );
}

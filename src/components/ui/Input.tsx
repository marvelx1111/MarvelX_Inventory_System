import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/format';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-tertiary)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-[var(--border-primary)]',
            className,
          )}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {!error && hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-[var(--text-tertiary)]">
            {hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

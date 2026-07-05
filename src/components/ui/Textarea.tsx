import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/format';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'flex min-h-[100px] w-full resize-y rounded-lg border bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-tertiary)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
              : 'border-[var(--border-primary)]',
            className,
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>
        )}
        {!error && hint && (
          <p className="mt-1.5 text-xs text-[var(--text-tertiary)]">{hint}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

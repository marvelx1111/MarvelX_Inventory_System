import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/format';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, id, options, placeholder, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-[var(--text-primary)]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'flex h-10 w-full appearance-none rounded-lg border bg-[var(--bg-secondary)] px-3 py-2 pr-10 text-sm text-[var(--text-primary)] transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50',
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20'
                : 'border-[var(--border-primary)]',
              className,
            )}
            aria-invalid={error ? true : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
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

Select.displayName = 'Select';

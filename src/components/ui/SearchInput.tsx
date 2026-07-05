import { motion } from 'framer-motion';
import { forwardRef, useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/format';

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
  containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, value, defaultValue, onClear, onChange, ...props }, ref) => {
    const [internal, setInternal] = useState(String(defaultValue ?? ''));
    const current = value !== undefined ? String(value) : internal;
    const hasValue = current.length > 0;

    return (
      <div className={cn('relative', containerClassName)}>
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-tertiary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
          />
        </svg>
        <input
          ref={ref}
          type="search"
          value={current}
          onChange={(e) => {
            if (value === undefined) setInternal(e.target.value);
            onChange?.(e);
          }}
          className={cn(
            'flex h-10 w-full rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)] py-2 pl-10 pr-10 text-sm text-[var(--text-primary)] transition-colors placeholder:text-[var(--text-tertiary)] focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20',
            className,
          )}
          {...props}
        />
        {hasValue && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              if (value === undefined) setInternal('');
              onClear?.();
            }}
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
            aria-label="Clear search"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = 'SearchInput';

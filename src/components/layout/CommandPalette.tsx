import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { store, type GlobalSearchResult } from '@/data/store';
import { cn } from '@/utils/format';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  vehicle: 'Vehicle',
  customer: 'Customer',
  ppf_job: 'PPF Job',
  sale: 'Sale',
  investor: 'Investor',
};

const typeIcons: Record<string, ReactNode> = {
  vehicle: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  customer: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ppf_job: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  sale: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  investor: (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

function resultHref(result: GlobalSearchResult): string {
  switch (result.type) {
    case 'vehicle':
      return `/inventory/${result.id}`;
    case 'customer':
      return `/customers/${result.id}`;
    case 'ppf_job':
      return `/ppf/jobs/${result.id}`;
    case 'sale':
      return `/sales/${result.id}`;
    case 'investor':
      return `/investors/${result.id}`;
    default:
      return `/${result.module}/${result.id}`;
  }
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => store.searchGlobal(query), [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const selectResult = useCallback(
    (result: GlobalSearchResult) => {
      navigate(resultHref(result));
      onClose();
    },
    [navigate, onClose],
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        selectResult(results[selectedIndex]);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose, results, selectedIndex, selectResult]);

  return (
    <AnimatePresence>
      {open && (
        <div className="no-print fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[15vh]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="relative z-10 w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-elevated)] shadow-[var(--shadow-lift)]"
          >
            <div className="flex items-center gap-3 border-b border-[var(--border-secondary)] px-4">
              <svg
                className="h-5 w-5 shrink-0 text-[var(--text-tertiary)]"
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
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vehicles, customers, PPF jobs..."
                className="h-14 flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
              />
              <kbd className="hidden rounded-md border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-2 py-1 text-[10px] font-medium text-[var(--text-tertiary)] sm:inline-block">
                ESC
              </kbd>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-[var(--text-tertiary)]">
                  {query ? 'No results found.' : 'Start typing to search across the ERP.'}
                </div>
              ) : (
                <ul className="space-y-0.5">
                  {results.map((result, index) => (
                    <li key={`${result.type}-${result.id}`}>
                      <button
                        type="button"
                        onClick={() => selectResult(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
                          index === selectedIndex
                            ? 'bg-[var(--bg-active)] text-accent'
                            : 'text-[var(--text-primary)] hover:bg-[var(--bg-hover)]',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                            index === selectedIndex
                              ? 'bg-accent/10 text-accent'
                              : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
                          )}
                        >
                          {typeIcons[result.type] ?? typeIcons.customer}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{result.title}</span>
                          <span className="block truncate text-xs text-[var(--text-tertiary)]">
                            {result.subtitle}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-md bg-[var(--bg-tertiary)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                          {typeLabels[result.type] ?? result.module}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-[var(--border-secondary)] px-4 py-2.5 text-[10px] text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[var(--border-primary)] px-1">↑</kbd>
                <kbd className="rounded border border-[var(--border-primary)] px-1">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[var(--border-primary)] px-1">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded border border-[var(--border-primary)] px-1.5">esc</kbd>
                close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return {
    open,
    openPalette: () => setOpen(true),
    closePalette: () => setOpen(false),
    togglePalette: () => setOpen((prev) => !prev),
  };
}

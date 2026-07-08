import {
  AnimatePresence,
  motion,
} from 'framer-motion';
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/utils/format';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (options: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastCounter = 0;

const variantStyles: Record<ToastVariant, { icon: string; bar: string; bg: string }> = {
  success: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    bg: 'bg-[var(--bg-elevated)] border-emerald-200/60 dark:border-emerald-900/40',
  },
  error: {
    icon: 'text-red-600 dark:text-red-400',
    bar: 'bg-red-500',
    bg: 'bg-[var(--bg-elevated)] border-red-200/60 dark:border-red-900/40',
  },
  warning: {
    icon: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    bg: 'bg-[var(--bg-elevated)] border-amber-200/60 dark:border-amber-900/40',
  },
  info: {
    icon: 'text-red-600 dark:text-red-400',
    bar: 'bg-red-600',
    bg: 'bg-[var(--bg-elevated)] border-red-200/60 dark:border-red-900/40',
  },
};

const variantIcons: Record<ToastVariant, ReactNode> = {
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" />
    </svg>
  ),
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const styles = variantStyles[toast.variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={cn(
        'pointer-events-auto relative flex w-full max-w-sm gap-3 overflow-hidden rounded-xl border p-4 shadow-[var(--shadow-lift)]',
        styles.bg,
      )}
    >
      <div className={cn('absolute left-0 top-0 h-full w-1', styles.bar)} />
      <div className={cn('mt-0.5 shrink-0', styles.icon)}>{variantIcons[toast.variant]}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text-primary)]">{toast.title}</p>
        {toast.description && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded-md p-1 text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
        aria-label="Dismiss"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: Omit<Toast, 'id'>) => {
      const id = `toast-${++toastCounter}`;
      const duration = options.duration ?? 4000;
      const next: Toast = { ...options, id };
      setToasts((prev) => [...prev, next]);
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration);
      }
    },
    [dismiss],
  );

  const success = useCallback(
    (title: string, description?: string) => toast({ title, description, variant: 'success' }),
    [toast],
  );
  const error = useCallback(
    (title: string, description?: string) => toast({ title, description, variant: 'error' }),
    [toast],
  );
  const warning = useCallback(
    (title: string, description?: string) => toast({ title, description, variant: 'warning' }),
    [toast],
  );
  const info = useCallback(
    (title: string, description?: string) => toast({ title, description, variant: 'info' }),
    [toast],
  );

  const value = useMemo<ToastContextValue>(
    () => ({ toasts, toast, dismiss, success, error, warning, info }),
    [toasts, toast, dismiss, success, error, warning, info],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

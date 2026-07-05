import { AnimatePresence, motion } from 'framer-motion';
import { createContext, useContext, useId, useState, type ReactNode } from 'react';
import { cn } from '@/utils/format';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  id: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs components must be used within Tabs');
  return ctx;
}

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const id = useId();
  const current = value ?? internal;

  const setValue = (next: string) => {
    if (value === undefined) setInternal(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value: current, setValue, id }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] p-1',
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({ value, children, className, disabled }: TabsTriggerProps) {
  const { value: selected, setValue, id } = useTabsContext();
  const isActive = selected === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${id}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${id}-panel-${value}`}
      disabled={disabled}
      onClick={() => setValue(value)}
      className={cn(
        'relative rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:cursor-not-allowed disabled:opacity-50',
        isActive
          ? 'text-[var(--text-primary)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
        className,
      )}
    >
      {isActive && (
        <motion.span
          layoutId={`${id}-tab-indicator`}
          className="absolute inset-0 rounded-lg bg-[var(--bg-secondary)] shadow-[var(--shadow-soft)]"
          transition={{ type: 'spring', stiffness: 500, damping: 34 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className }: TabsContentProps) {
  const { value: selected, id } = useTabsContext();
  const isActive = selected === value;

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          key={value}
          role="tabpanel"
          id={`${id}-panel-${value}`}
          aria-labelledby={`${id}-tab-${value}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className={cn('mt-4 focus:outline-none', className)}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

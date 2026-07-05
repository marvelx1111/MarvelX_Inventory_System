import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

export interface BadgeProps extends Omit<HTMLMotionProps<'span'>, 'children'> {
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
  children?: ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  accent: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400',
};

const dotClasses: Record<BadgeVariant, string> = {
  default: 'bg-zinc-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  accent: 'bg-indigo-500',
};

export function Badge({
  className,
  variant = 'default',
  dot = false,
  pulse = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <motion.span
              className={cn('absolute inline-flex h-full w-full rounded-full opacity-75', dotClasses[variant])}
              animate={{ scale: [1, 1.8, 1], opacity: [0.75, 0, 0.75] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <span className={cn('relative inline-flex h-2 w-2 rounded-full', dotClasses[variant])} />
        </span>
      )}
      {children}
    </motion.span>
  );
}

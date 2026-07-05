import { motion, type HTMLMotionProps } from 'framer-motion';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/format';

export interface CardProps extends HTMLMotionProps<'div'> {
  hoverLift?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
};

export function Card({
  className,
  hoverLift = false,
  padding = 'md',
  children,
  ...props
}: CardProps) {
  return (
    <motion.div
      whileHover={
        hoverLift ? { y: -2, boxShadow: 'var(--shadow-lift)' } : undefined
      }
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={cn(
        'rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] shadow-[var(--shadow-card)]',
        paddingClasses[padding],
        hoverLift && 'cursor-default transition-shadow',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex flex-col gap-1', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold tracking-tight text-[var(--text-primary)]', className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-[var(--text-secondary)]', className)} {...props} />
  );
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-4 flex items-center gap-2 border-t border-[var(--border-secondary)] pt-4', className)}
      {...props}
    />
  );
}

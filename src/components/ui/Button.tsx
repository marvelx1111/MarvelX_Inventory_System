import { motion, type HTMLMotionProps } from 'framer-motion';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils/format';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-white shadow-sm hover:bg-accent-hover focus-visible:ring-accent/40 disabled:bg-accent/50',
  secondary:
    'border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)] focus-visible:ring-accent/30',
  ghost:
    'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] focus-visible:ring-accent/30',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/40 disabled:bg-red-400',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs font-medium',
  md: 'h-10 gap-2 rounded-lg px-4 text-sm font-medium',
  lg: 'h-12 gap-2.5 rounded-xl px-6 text-base font-medium',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      iconRight,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        whileHover={isDisabled ? undefined : { y: -1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-primary)] disabled:cursor-not-allowed disabled:opacity-60',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        disabled={isDisabled}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {loading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        ) : (
          icon
        )}
        {children}
        {!loading && iconRight}
      </motion.button>
    );
  },
);

Button.displayName = 'Button';

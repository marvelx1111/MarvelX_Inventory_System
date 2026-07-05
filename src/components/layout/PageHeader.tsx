import type { ReactNode } from 'react';
import { cn } from '@/utils/format';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 text-sm text-[var(--text-secondary)] sm:text-base">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

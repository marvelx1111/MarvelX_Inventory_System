import type { ReactNode } from 'react';
import { PrintButton } from '@/components/ui/PrintButton';
import { PrintDocumentHeader } from '@/components/layout/PrintDocumentHeader';
import { cn } from '@/utils/format';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
  /** Show print button and print-friendly document header. Default: true */
  printable?: boolean;
  /** Document title used in print dialog / header (defaults to page title) */
  printTitle?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
  printable = true,
  printTitle,
}: PageHeaderProps) {
  const documentTitle = printTitle ?? title;

  return (
    <>
      {printable && <PrintDocumentHeader title={documentTitle} subtitle={subtitle} />}
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
        {(printable || actions) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 no-print">
            {printable && <PrintButton title={documentTitle} />}
            {actions}
          </div>
        )}
      </div>
    </>
  );
}

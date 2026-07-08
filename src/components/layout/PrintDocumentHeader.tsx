import { BRAND } from '@/utils/constants';

interface PrintDocumentHeaderProps {
  title: string;
  subtitle?: string;
}

export function PrintDocumentHeader({ title, subtitle }: PrintDocumentHeaderProps) {
  const printedAt = new Date().toLocaleString('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="print-document-header mb-0 hidden print:mb-6 print:block print:border-b print:border-zinc-300 print:pb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold tracking-tight text-[#cd1719]">{BRAND.name}</p>
          <p className="mt-1 text-base font-semibold text-zinc-900">{title}</p>
          {subtitle && <p className="mt-0.5 text-sm text-zinc-600">{subtitle}</p>}
        </div>
        <div className="text-right text-xs text-zinc-500">
          <p>Printed</p>
          <p className="font-medium text-zinc-700">{printedAt}</p>
        </div>
      </div>
    </div>
  );
}

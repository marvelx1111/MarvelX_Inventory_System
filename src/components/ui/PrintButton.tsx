import { Button } from '@/components/ui/Button';
import { usePrint } from '@/hooks/usePrint';
import { cn } from '@/utils/format';

interface PrintButtonProps {
  title?: string;
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function PrinterIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 9V4h12v5M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v7H6v-7z"
      />
    </svg>
  );
}

export function PrintButton({
  title,
  label = 'Print',
  className,
  size = 'sm',
}: PrintButtonProps) {
  const { print } = usePrint();

  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      className={cn('no-print', className)}
      onClick={() => print(title)}
      icon={<PrinterIcon />}
      title="Print to connected printer"
    >
      {label}
    </Button>
  );
}

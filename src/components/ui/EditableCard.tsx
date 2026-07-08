import type { ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useCanEdit } from '@/hooks/useCanEdit';

interface EditableCardProps {
  title: string;
  subtitle?: string;
  onEdit?: () => void;
  editLabel?: string;
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md';
  className?: string;
  headerClassName?: string;
}

export function EditableCard({
  title,
  subtitle,
  onEdit,
  editLabel = 'Edit',
  children,
  padding = 'md',
  className,
  headerClassName,
}: EditableCardProps) {
  const canEdit = useCanEdit();

  return (
    <Card padding={padding} className={className}>
      <CardHeader className={headerClassName}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>
            )}
          </div>
          {canEdit && onEdit && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="no-print shrink-0 border-accent/30 text-accent hover:bg-accent/10"
              onClick={onEdit}
              icon={
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
            >
              {editLabel}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { cn } from '@/utils/format';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  className?: string;
}

function DefaultIllustration() {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-32 w-40"
      aria-hidden
    >
      <defs>
        <linearGradient id="empty-gradient" x1="0" y1="0" x2="200" y2="160">
          <stop offset="0%" stopColor="#6366F1" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#818CF8" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="20" y="30" width="160" height="100" rx="12" fill="url(#empty-gradient)" />
      <rect
        x="20"
        y="30"
        width="160"
        height="100"
        rx="12"
        stroke="#6366F1"
        strokeOpacity="0.2"
        strokeWidth="1.5"
        strokeDasharray="6 4"
      />
      <circle cx="100" cy="65" r="18" fill="#6366F1" fillOpacity="0.12" />
      <path
        d="M92 65h16M100 57v16"
        stroke="#6366F1"
        strokeOpacity="0.5"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="50" y="95" width="100" height="8" rx="4" fill="#6366F1" fillOpacity="0.1" />
      <rect x="65" y="110" width="70" height="6" rx="3" fill="#6366F1" fillOpacity="0.08" />
      <motion.circle
        cx="165"
        cy="45"
        r="4"
        fill="#6366F1"
        fillOpacity="0.3"
        animate={{ y: [0, -4, 0], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle
        cx="35"
        cy="115"
        r="3"
        fill="#818CF8"
        fillOpacity="0.4"
        animate={{ y: [0, 3, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </svg>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'flex flex-col items-center justify-center px-6 py-16 text-center',
        className,
      )}
    >
      <div className="mb-6">{icon ?? <DefaultIllustration />}</div>
      <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-[var(--text-secondary)]">{description}</p>
      )}
      {action && (
        <Button className="mt-6" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}

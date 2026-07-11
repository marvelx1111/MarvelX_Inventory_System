import { NavLink } from 'react-router-dom';
import { cn } from '@/utils/format';

const TABS = [
  { label: 'Jobs', href: '/ppf', end: true },
  { label: 'Roll Inventory', href: '/ppf/rolls', end: false },
] as const;

export function PPFStudioNav() {
  return (
    <nav
      className="mb-6 inline-flex w-full max-w-md rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] p-1 sm:w-auto"
      aria-label="PPF Studio sections"
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.href}
          to={tab.href}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              'flex-1 rounded-lg px-4 py-2 text-center text-sm font-medium transition-colors sm:flex-none',
              isActive
                ? 'bg-[var(--bg-elevated)] text-accent shadow-[var(--shadow-soft)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

import { useState, type ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { DataConnectionBanner } from './DataConnectionBanner';
import { CommandPalette, useCommandPalette } from './CommandPalette';
import { MobileNav } from './MobileNav';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children?: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { open, openPalette, closePalette } = useCommandPalette();

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/80 px-4 backdrop-blur-md md:px-6">
          <div className="flex min-w-0 items-center gap-3 md:hidden">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white"
              style={{ background: '#6366F1' }}
            >
              MX
            </div>
            <span className="truncate text-sm font-semibold text-[var(--text-primary)]">
              Marvel X
            </span>
          </div>

          <button
            type="button"
            onClick={openPalette}
            className="hidden max-w-md flex-1 items-center gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)] px-4 py-2 text-left text-sm text-[var(--text-tertiary)] transition-colors hover:border-accent/40 hover:bg-[var(--bg-hover)] md:flex"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
              />
            </svg>
            <span className="flex-1">Search anything...</span>
            <kbd className="rounded-md border border-[var(--border-primary)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>

          <Button
            variant="secondary"
            size="sm"
            className="md:hidden"
            onClick={openPalette}
            icon={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z"
                />
              </svg>
            }
          >
            Search
          </Button>
        </header>

        <DataConnectionBanner />

        <main className="flex-1 overflow-y-auto px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children ?? <Outlet />}
        </main>
      </div>

      <MobileNav />
      <CommandPalette open={open} onClose={closePalette} />
    </div>
  );
}

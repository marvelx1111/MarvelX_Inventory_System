import { AnimatePresence, motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { BRAND, NAV_ITEMS } from '@/utils/constants';
import { cn, getInitials } from '@/utils/format';
import { NavIcon } from './NavIcon';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, hasPermission, logout, isAdmin, canEdit } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const visibleItems = NAV_ITEMS.filter((item) => hasPermission(item.module));

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
      className="no-print hidden h-screen shrink-0 flex-col border-r border-[var(--border-primary)] bg-[var(--bg-sidebar)] md:flex"
      style={{ background: 'var(--gradient-sidebar)' }}
    >
      <div className="flex h-16 items-center gap-3 border-b border-[var(--border-secondary)] px-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
          style={{ background: BRAND.accent }}
        >
          MX
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="min-w-0"
            >
              <p className="truncate text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                {BRAND.name}
              </p>
              <p className="truncate text-xs text-[var(--text-tertiary)]">{BRAND.tagline}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {visibleItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--bg-active)] text-accent'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-xl bg-[var(--bg-active)]"
                    transition={{ type: 'spring', stiffness: 500, damping: 34 }}
                  />
                )}
                <span className="relative z-10">
                  <NavIcon icon={item.icon} className={isActive ? 'text-accent' : undefined} />
                </span>
                {!collapsed && (
                  <span className="relative z-10 truncate">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[var(--border-secondary)] p-3">
        <div className={cn('mb-2 flex items-center gap-2', collapsed && 'justify-center')}>
          {!collapsed && user && (
            <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl bg-[var(--bg-tertiary)] px-3 py-2">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ background: 'var(--gradient-brand)' }}
              >
                {getInitials(user.full_name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {user.full_name}
                </p>
                <p className="truncate text-xs text-[var(--text-tertiary)]">
                  @{user.username}
                  {isAdmin ? ' · Admin' : canEdit ? ' · Can edit' : ' · View only'}
                </p>
              </div>
            </div>
          )}
          {collapsed && user && (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={{ background: 'var(--gradient-brand)' }}
              title={user.full_name}
            >
              {getInitials(user.full_name)}
            </div>
          )}
        </div>

        <div className={cn('flex gap-1', collapsed ? 'flex-col' : 'flex-row')}>
          <button
            type="button"
            onClick={toggleTheme}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="flex flex-1 items-center justify-center rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            {theme === 'light' ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="flex flex-1 items-center justify-center rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          >
            <svg
              className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            title="Sign out"
            className="flex flex-1 items-center justify-center rounded-lg p-2 text-[var(--text-secondary)] transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </motion.aside>
  );
}

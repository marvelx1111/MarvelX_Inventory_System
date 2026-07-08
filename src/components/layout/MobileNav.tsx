import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { NAV_ITEMS } from '@/utils/constants';
import { cn } from '@/utils/format';
import { NavIcon } from './NavIcon';

const MOBILE_NAV_MODULES = ['dashboard', 'inventory', 'sales', 'customers', 'ppf'] as const;

export function MobileNav() {
  const { hasPermission } = useAuth();

  const items = NAV_ITEMS.filter(
    (item) =>
      MOBILE_NAV_MODULES.includes(item.module as (typeof MOBILE_NAV_MODULES)[number]) &&
      hasPermission(item.module),
  );

  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-primary)] bg-[var(--bg-elevated)]/95 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent' : 'text-[var(--text-tertiary)]',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl transition-colors',
                    isActive ? 'bg-[var(--bg-active)]' : 'bg-transparent',
                  )}
                >
                  <NavIcon icon={item.icon} className={isActive ? 'text-accent' : undefined} />
                </span>
                <span className="truncate">{item.label.split(' ')[0]}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

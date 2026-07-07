import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { store } from '@/data/store';
import { useDataSource } from '@/contexts/DataContext';
import type { PermissionModule, User } from '@/types';

const SESSION_KEY = 'marvel-x-session';
export const ADMIN_ROLE_ID = 'rol_001';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  hasPermission: (module: PermissionModule) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSessionUserId(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { status: dataStatus, source } = useDataSource();
  const [sessionUserId, setSessionUserId] = useState<string | null>(() => loadSessionUserId());
  const [authEpoch, setAuthEpoch] = useState(0);

  // Re-resolve user & permissions when Supabase hydration completes
  const user = useMemo(() => {
    if (!sessionUserId) return null;
    return store.getUsers().find((u) => u.user_id === sessionUserId) ?? null;
  }, [sessionUserId, dataStatus, source, authEpoch]);

  const permissions = useMemo(
    () => (user ? new Set(store.getUserPermissions(user.user_id)) : new Set<string>()),
    [user, dataStatus, source, authEpoch],
  );

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (user.role_id === ADMIN_ROLE_ID) return true;
    const role = store.getRoles().find((r) => r.role_id === user.role_id);
    return role?.role_name === 'Admin';
  }, [user, dataStatus, source, authEpoch]);

  const canEdit = isAdmin || permissions.has('users');

  useEffect(() => {
    if (dataStatus === 'ready') {
      setAuthEpoch((n) => n + 1);
    }
  }, [dataStatus, source]);

  const login = useCallback((username: string, password: string): boolean => {
    const authenticated = store.authenticate(username, password);
    if (!authenticated) return false;
    setSessionUserId(authenticated.user_id);
    setAuthEpoch((n) => n + 1);
    localStorage.setItem(SESSION_KEY, authenticated.user_id);
    return true;
  }, []);

  const logout = useCallback(() => {
    setSessionUserId(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const hasPermission = useCallback(
    (module: PermissionModule): boolean => isAdmin || permissions.has(module),
    [isAdmin, permissions],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isAdmin,
      canEdit,
      login,
      logout,
      hasPermission,
    }),
    [user, isAdmin, canEdit, login, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useRequireAuth(): AuthContextValue & { user: User } {
  const auth = useAuth();
  if (!auth.user) throw new Error('Authentication required');
  return auth as AuthContextValue & { user: User };
}

export function usePermission(module: PermissionModule): boolean {
  const { hasPermission } = useAuth();
  const [allowed, setAllowed] = useState(() => hasPermission(module));

  useEffect(() => {
    setAllowed(hasPermission(module));
  }, [hasPermission, module]);

  return allowed;
}

export function usePermissions() {
  const { hasPermission } = useAuth();
  return useCallback(
    (modules: PermissionModule[]) => modules.some((m) => hasPermission(m)),
    [hasPermission],
  );
}

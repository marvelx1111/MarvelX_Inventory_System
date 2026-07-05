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
import type { PermissionModule, User } from '@/types';

const SESSION_KEY = 'marvel-x-session';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
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
  const [sessionUserId, setSessionUserId] = useState<string | null>(() => loadSessionUserId());

  const user = useMemo(() => {
    if (!sessionUserId) return null;
    return store.getUsers().find((u) => u.user_id === sessionUserId) ?? null;
  }, [sessionUserId]);

  const permissions = useMemo(
    () => (user ? new Set(store.getUserPermissions(user.user_id)) : new Set<string>()),
    [user],
  );

  const login = useCallback((username: string, password: string): boolean => {
    const authenticated = store.authenticate(username, password);
    if (!authenticated) return false;
    setSessionUserId(authenticated.user_id);
    localStorage.setItem(SESSION_KEY, authenticated.user_id);
    return true;
  }, []);

  const logout = useCallback(() => {
    setSessionUserId(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const hasPermission = useCallback(
    (module: PermissionModule): boolean => permissions.has(module),
    [permissions],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      hasPermission,
    }),
    [user, login, logout, hasPermission],
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

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
import {
  fetchAppUserByAuthId,
  isDemoAuthEnabled,
  resolveAppUserFromSession,
} from '@/lib/auth';
import { getSupabaseBrowserClient, isSupabaseConfigured, signOutSupabase } from '@/lib/supabase';
import type { PermissionModule, User } from '@/types';

export const ADMIN_ROLE_ID = 'rol_001';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface LoginResult {
  ok: boolean;
  message?: string;
}

interface AuthContextValue {
  user: User | null;
  authStatus: AuthStatus;
  isAuthenticated: boolean;
  isAdmin: boolean;
  canEdit: boolean;
  authError: string | null;
  usesSupabaseAuth: boolean;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  hasPermission: (module: PermissionModule) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authEpoch, setAuthEpoch] = useState(0);
  const [dataRevision, setDataRevision] = useState(() => store.getRevision());

  useEffect(() => {
    return store.subscribe(() => setDataRevision(store.getRevision()));
  }, []);

  const usesSupabaseAuth = isSupabaseConfigured() && !isDemoAuthEnabled();
  const client = getSupabaseBrowserClient();

  const applyUser = useCallback((next: User | null) => {
    setUser(next);
    if (next) {
      store.upsertUser(next);
      setAuthStatus('authenticated');
      setAuthError(null);
    } else {
      setAuthStatus('unauthenticated');
    }
    setAuthEpoch((n) => n + 1);
  }, []);

  const resolveSupabaseSession = useCallback(async () => {
    if (!client) {
      setAuthStatus('unauthenticated');
      setAuthError('Supabase is not configured.');
      return;
    }

    const { data: { session }, error } = await client.auth.getSession();
    if (error) {
      setAuthStatus('unauthenticated');
      setAuthError(error.message);
      return;
    }

    try {
      const appUser = await resolveAppUserFromSession(client, session);
      if (!session) {
        applyUser(null);
        return;
      }
      if (!appUser) {
        await signOutSupabase();
        applyUser(null);
        setAuthError('No active Marvel X profile is linked to this account.');
        return;
      }
      applyUser(appUser);
    } catch (err) {
      await signOutSupabase();
      applyUser(null);
      setAuthError(err instanceof Error ? err.message : 'Failed to resolve user profile');
    }
  }, [applyUser, client]);

  useEffect(() => {
    if (!usesSupabaseAuth) {
      setAuthStatus('unauthenticated');
      return;
    }

    if (!client) {
      setAuthStatus('unauthenticated');
      setAuthError('Supabase client unavailable.');
      return;
    }

    void resolveSupabaseSession();

    const { data: { subscription } } = client.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        applyUser(null);
        return;
      }

      try {
        const appUser = await fetchAppUserByAuthId(client, session.user.id);
        if (!appUser) {
          await signOutSupabase();
          applyUser(null);
          setAuthError('No active Marvel X profile is linked to this account.');
          return;
        }
        applyUser(appUser);
      } catch (err) {
        await signOutSupabase();
        applyUser(null);
        setAuthError(err instanceof Error ? err.message : 'Failed to resolve user profile');
      }
    });

    return () => subscription.unsubscribe();
  }, [applyUser, client, resolveSupabaseSession, usesSupabaseAuth]);

  useEffect(() => {
    setAuthEpoch((n) => n + 1);
  }, [dataRevision]);

  const permissions = useMemo(
    () => (user ? new Set(store.getUserPermissions(user.user_id)) : new Set<string>()),
    [user, authEpoch, dataRevision],
  );

  const isAdmin = useMemo(() => {
    if (!user) return false;
    if (user.role_id === ADMIN_ROLE_ID) return true;
    const role = store.getRoles().find((r) => r.role_id === user.role_id);
    return role?.role_name === 'Admin';
  }, [user, authEpoch, dataRevision]);

  const canEdit = isAdmin || permissions.has('users');

  const login = useCallback(
    async (identifier: string, password: string): Promise<LoginResult> => {
      const trimmedId = identifier.trim();
      const trimmedPassword = password;

      if (!trimmedId || !trimmedPassword) {
        return { ok: false, message: 'Email and password are required.' };
      }

      if (usesSupabaseAuth) {
        if (!client) {
          return { ok: false, message: 'Supabase is not configured.' };
        }

        const email = trimmedId.includes('@') ? trimmedId : `${trimmedId}@marvelx.pk`;
        const { data, error } = await client.auth.signInWithPassword({
          email,
          password: trimmedPassword,
        });

        if (error) {
          return { ok: false, message: 'Invalid email or password.' };
        }

        if (!data.session) {
          return { ok: false, message: 'Sign-in did not create a session.' };
        }

        const appUser = await fetchAppUserByAuthId(client, data.session.user.id);
        if (!appUser) {
          await signOutSupabase();
          return {
            ok: false,
            message: 'Account signed in but no active Marvel X profile is linked. Contact an administrator.',
          };
        }

        applyUser(appUser);
        return { ok: true };
      }

      if (!isDemoAuthEnabled()) {
        return {
          ok: false,
          message: 'Demo authentication is disabled. Configure Supabase Auth for production login.',
        };
      }

      const demoUser = store.authenticateDemo(trimmedId, trimmedPassword);
      if (!demoUser) {
        return { ok: false, message: 'Invalid username or password.' };
      }

      applyUser(demoUser);
      return { ok: true };
    },
    [applyUser, client, usesSupabaseAuth],
  );

  const logout = useCallback(async () => {
    if (usesSupabaseAuth) {
      await signOutSupabase();
    }
    applyUser(null);
    store.reset();
  }, [applyUser, usesSupabaseAuth]);

  const hasPermission = useCallback(
    (module: PermissionModule): boolean => isAdmin || permissions.has(module),
    [isAdmin, permissions],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authStatus,
      isAuthenticated: user !== null,
      isAdmin,
      canEdit,
      authError,
      usesSupabaseAuth,
      login,
      logout,
      hasPermission,
    }),
    [user, authStatus, isAdmin, canEdit, authError, usesSupabaseAuth, login, logout, hasPermission],
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

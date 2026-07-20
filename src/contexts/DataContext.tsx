import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAllFromSupabase, testSupabaseConnection } from '@/data/supabase-loader';
import { store } from '@/data/store';
import { isDemoAuthEnabled } from '@/lib/auth';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase';

type DataSource = 'loading' | 'supabase' | 'local';
type DataStatus = 'loading' | 'ready' | 'error';

interface DataContextValue {
  source: DataSource;
  status: DataStatus;
  error: string | null;
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, authStatus } = useAuth();
  const [source, setSource] = useState<DataSource>('loading');
  const [status, setStatus] = useState<DataStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    if (authStatus === 'loading') {
      setStatus('loading');
      return;
    }

    if (isDemoAuthEnabled()) {
      setSource('local');
      setStatus('ready');
      setError(null);
      return;
    }

    if (!isSupabaseConfigured()) {
      store.reset();
      setSource('local');
      setStatus('error');
      setError('Supabase is not configured. Changes cannot be saved.');
      return;
    }

    if (!isAuthenticated) {
      store.reset();
      setSource('loading');
      setStatus('ready');
      return;
    }

    setStatus('loading');

    const client = getSupabaseBrowserClient();
    if (!client) {
      store.reset();
      setSource('local');
      setStatus('error');
      setError('Supabase client unavailable. Changes cannot be saved.');
      return;
    }

    try {
      await testSupabaseConnection(client);
      const data = await fetchAllFromSupabase(client);
      store.hydrate(data);
      setSource('supabase');
      setStatus('ready');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load Supabase data';
      store.reset();
      setError(message);
      setSource('local');
      setStatus('error');
    }
  }, [authStatus, isAuthenticated]);

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(
    () => ({ source, status, error, reload: load }),
    [source, status, error, load],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useDataSource(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useDataSource must be used within DataProvider');
  return ctx;
}

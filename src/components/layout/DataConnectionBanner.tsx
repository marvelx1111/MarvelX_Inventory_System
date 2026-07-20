import { useDataSource } from '@/contexts/DataContext';

export function DataConnectionBanner() {
  const { source, status, error } = useDataSource();

  if (status === 'loading' || source === 'supabase') return null;

  const isError = status === 'error';
  const title = isError ? 'Database connection failed' : 'Database not configured';
  const message = isError
    ? `${error ?? 'Could not reach Supabase'}. Data cannot be loaded or saved until the connection is restored.`
    : 'Supabase is not configured on this deployment. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel, then redeploy.';

  return (
    <div
      role="alert"
      className={`no-print border-b px-4 py-2.5 text-sm md:px-8 ${
        isError
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
          : 'border-amber-500/30 bg-amber-500/10 text-amber-100'
      }`}
    >
      <p className="font-medium">{title}</p>
      <p className="mt-0.5 text-xs opacity-90">{message}</p>
    </div>
  );
}

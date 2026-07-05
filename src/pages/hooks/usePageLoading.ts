import { useEffect, useState } from 'react';

export function usePageLoading(delay = 300): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), delay);
    return () => window.clearTimeout(timer);
  }, [delay]);

  return loading;
}

import { useCallback } from 'react';
import { BRAND } from '@/utils/constants';

export function usePrint() {
  const print = useCallback((documentTitle?: string) => {
    const previousTitle = document.title;
    if (documentTitle) {
      document.title = `${documentTitle} — ${BRAND.name}`;
    }

    const restoreTitle = () => {
      document.title = previousTitle;
    };

    window.addEventListener('afterprint', restoreTitle, { once: true });

    requestAnimationFrame(() => {
      window.print();
    });
  }, []);

  return { print };
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Scroll to the element named in the URL hash once content has loaded, and briefly highlight it. */
export function useHashScroll(ready: boolean) {
  const { hash } = useLocation();
  useEffect(() => {
    if (!ready || !hash) return;
    const id = decodeURIComponent(hash.slice(1));
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el instanceof HTMLDetailsElement) el.open = true;
      el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      el.classList.remove('target-flash');
      void el.offsetWidth;
      el.classList.add('target-flash');
    }, 60);
    return () => window.clearTimeout(t);
  }, [ready, hash]);
}

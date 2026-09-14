import { useEffect, useState } from 'react';

// Deliberately not a full routing library — this site only ever has a
// handful of top-level pages, so a plain History API wrapper (pathname +
// pushState, synced via a popstate listener) covers it without pulling in
// a router dependency.
export function usePathname(): string {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  return pathname;
}

export function navigate(path: string) {
  if (path === window.location.pathname) return;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

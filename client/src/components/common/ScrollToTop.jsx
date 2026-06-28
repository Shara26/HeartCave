import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Resets window scroll to the top whenever the route path changes.
// Prevents new pages from inheriting the previous page's scroll position
// (e.g. landing on the dashboard already scrolled down after a long form).
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
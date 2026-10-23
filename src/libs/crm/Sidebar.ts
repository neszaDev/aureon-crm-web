/**
 * Where a viewer's choice for the workspace sidebar is kept, in their browser: `collapsed` (the
 * icon strip) or `expanded`. Without one the width decides: expanded from 1280 px, the strip
 * from 768 px to 1279 px (`strip` in global.css).
 */
export const SIDEBAR_KEY = 'aureon.sidebar';

/**
 * Inline script for `<head>`: puts the stored choice on `<html>` (`data-sidebar`) before the
 * first paint, so the sidebar never jumps from one width to the other as the page loads. Storage
 * that can't be read leaves the width to decide.
 */
export const SIDEBAR_SCRIPT = `try{var s=localStorage.getItem('${SIDEBAR_KEY}');if(s==='collapsed'||s==='expanded')document.documentElement.dataset.sidebar=s}catch(e){}`;

/**
 * Puts the stored choice on `<html>` again, as `SIDEBAR_SCRIPT` did before the first paint: React
 * clears `<html>`'s attributes when it renders the root layout anew (Fast Refresh, or a client
 * render after a hydration error). Storage that can't be read leaves the width to decide. Browser
 * only.
 */
export const applyStoredSidebar = () => {
  try {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === 'collapsed' || stored === 'expanded') {
      document.documentElement.dataset.sidebar = stored;
    }
  } catch {
    // Storage is off (a private window, blocked site data).
  }
};

const WIDE = '(width >= 80rem)';

/**
 * Tells whether the sidebar shows as its icon strip: the viewer's choice, else the width's.
 * Browser only.
 * @returns Whether it is collapsed.
 */
export const isSidebarCollapsed = () => {
  const chosen = document.documentElement.dataset.sidebar;

  return chosen ? chosen === 'collapsed' : !window.matchMedia(WIDE).matches;
};

/**
 * Calls back when the sidebar's state may have changed: a choice made (in this tab) or the
 * window crossing 1280 px. Browser only.
 * @param onChange The callback.
 * @returns What stops it.
 */
export const subscribeToSidebar = (onChange: () => void) => {
  const wide = window.matchMedia(WIDE);
  const observer = new MutationObserver(onChange);
  wide.addEventListener('change', onChange);
  observer.observe(document.documentElement, { attributeFilter: ['data-sidebar'] });

  return () => {
    wide.removeEventListener('change', onChange);
    observer.disconnect();
  };
};

/**
 * Collapses an expanded sidebar or expands a collapsed one, now and on the viewer's next visits
 * (for this page only when storage is off). Browser only.
 */
export const toggleSidebar = () => {
  const next = isSidebarCollapsed() ? 'expanded' : 'collapsed';
  document.documentElement.dataset.sidebar = next;
  try {
    localStorage.setItem(SIDEBAR_KEY, next);
  } catch {
    // Storage is off (a private window, blocked site data): the choice lasts until a reload.
  }
};

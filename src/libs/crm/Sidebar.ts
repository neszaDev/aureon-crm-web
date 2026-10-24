/**
 * Where a viewer's choice for the workspace sidebar is kept, in their browser: `collapsed` (folded
 * into the rail) or `expanded`. Without one the width decides: expanded from 1280 px, folded from
 * 768 px to 1279 px (`strip` in global.css).
 */
export const SIDEBAR_KEY = 'aureon.sidebar';

/** Where a viewer's open spaces in the sidebar's tree are kept: their keys, space-separated. */
export const SPACES_KEY = 'aureon.spaces';

// What a stored list of open spaces may hold: lowercase keys, one space between them.
const SPACES = /^[a-z]+(?: [a-z]+)*$/u;

/**
 * Inline script for `<head>`: puts the stored choices on `<html>` (`data-sidebar`, and the open
 * spaces as `data-spaces`) before the first paint, so the sidebar never jumps from one width to
 * the other, nor its tree open, as the page loads. Storage that can't be read leaves the width to
 * decide and the tree closed.
 */
export const SIDEBAR_SCRIPT = `try{var d=document.documentElement.dataset,s=localStorage.getItem('${SIDEBAR_KEY}'),o=localStorage.getItem('${SPACES_KEY}');if(s==='collapsed'||s==='expanded')d.sidebar=s;if(o&&${SPACES}.test(o))d.spaces=o}catch(e){}`;

/**
 * Puts the stored choices on `<html>` again, as `SIDEBAR_SCRIPT` did before the first paint: React
 * clears `<html>`'s attributes when it renders the root layout anew (Fast Refresh, or a client
 * render after a hydration error). Storage that can't be read leaves the width to decide. Browser
 * only.
 */
export const applyStoredSidebar = () => {
  const { dataset } = document.documentElement;
  try {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === 'collapsed' || stored === 'expanded') {
      dataset.sidebar = stored;
    }
    const spaces = localStorage.getItem(SPACES_KEY);
    if (spaces && SPACES.test(spaces)) {
      dataset.spaces = spaces;
    }
  } catch {
    // Storage is off (a private window, blocked site data).
  }
};

const WIDE = '(width >= 80rem)';

/**
 * Tells whether the sidebar is folded into the rail: the viewer's choice, else the width's.
 * Browser only.
 * @returns Whether it is collapsed.
 */
const isSidebarCollapsed = () => {
  const chosen = document.documentElement.dataset.sidebar;

  return chosen ? chosen === 'collapsed' : !window.matchMedia(WIDE).matches;
};

/**
 * Calls back when the sidebar's state may have changed: a choice made (in this tab), a space opened
 * or closed, or the window crossing 1280 px. Browser only.
 * @param onChange The callback.
 * @returns What stops it.
 */
export const subscribeToSidebar = (onChange: () => void) => {
  const wide = window.matchMedia(WIDE);
  const observer = new MutationObserver(onChange);
  wide.addEventListener('change', onChange);
  observer.observe(document.documentElement, { attributeFilter: ['data-sidebar', 'data-spaces'] });

  return () => {
    wide.removeEventListener('change', onChange);
    observer.disconnect();
  };
};

// Keeps a choice on <html>, now and on the viewer's next visits (for this page only when storage
// is off).
const keep = (key: string, attribute: 'sidebar' | 'spaces', value: string) => {
  if (value) {
    document.documentElement.dataset[attribute] = value;
  } else {
    document.documentElement.removeAttribute(`data-${attribute}`);
  }
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage is off (a private window, blocked site data): the choice lasts until a reload.
  }
};

/** The sidebar's own toggle, which folds it. */
export const SIDEBAR_COLLAPSE_ID = 'crm-sidebar-collapse';
/** The rail strip's toggle, which expands the sidebar again. */
export const STRIP_EXPAND_ID = 'crm-strip-expand';

/**
 * Moves the focus from what a change hides to an element, a frame on, and again each frame while
 * it hasn't moved (an expanding sidebar is hidden at its transition's first instant, so it can't
 * take the focus then), for a few frames at most; never once the viewer put it elsewhere.
 * @param from What had the focus.
 * @param id The element's id.
 * @param frames How many frames to try.
 */
const moveFocus = (from: Element, id: string, frames = 12) => {
  requestAnimationFrame(() => {
    const active = document.activeElement;
    const target = document.querySelector<HTMLElement>(`#${id}`);
    if (!target || (active !== from && active !== null && active !== document.body)) {
      return;
    }
    target.focus();
    if (document.activeElement !== target && frames > 1) {
      moveFocus(from, id, frames - 1);
    }
  });
};

/**
 * Folds an expanded sidebar into the rail or expands a folded one. The focus, if it was in what
 * the change hides (the sidebar or the rail's strip of sections), moves to the toggle that undoes
 * it, rather than fall to the page. Browser only.
 */
export const toggleSidebar = () => {
  const collapsed = isSidebarCollapsed();
  const from = document.activeElement;
  keep(SIDEBAR_KEY, 'sidebar', collapsed ? 'expanded' : 'collapsed');
  if (from?.closest('#crm-sidebar, [data-strip]')) {
    moveFocus(from, collapsed ? SIDEBAR_COLLAPSE_ID : STRIP_EXPAND_ID);
  }
};

// The spaces open in the sidebar's tree, in the order they were opened.
const openSpaces = () => (document.documentElement.dataset.spaces ?? '').split(' ').filter(Boolean);

/**
 * Tells whether a space is open in the sidebar's tree, showing its views. Browser only.
 * @param space The space's key, such as `deals`.
 * @returns Whether it is open.
 */
const isSpaceOpen = (space: string) => openSpaces().includes(space);

/**
 * Opens a closed space in the sidebar's tree, or closes an open one. Browser only.
 * @param space The space's key, such as `deals`.
 */
export const toggleSpace = (space: string) => {
  const others = openSpaces().filter((key) => key !== space);
  keep(SPACES_KEY, 'spaces', (isSpaceOpen(space) ? others : [...others, space]).join(' '));
};

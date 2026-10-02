import type { GridCard } from './data';

// The draggable demo keeps its saved layout in the browser, like the Vue demo did.
const STORAGE_KEY = 'marksheet-draggable-layout';
const listeners = new Set<() => void>();

/**
 * Subscribes to changes of the saved layout (this tab and other tabs).
 * @param onChange Called when the saved layout changes.
 * @returns Unsubscribes.
 */
export const subscribeToSavedLayout = (onChange: () => void) => {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
};

/**
 * Reads the saved layout's JSON.
 * @returns The JSON, or `null` when nothing is saved or storage is unavailable.
 */
export const readSavedLayout = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be blocked (private mode, site settings): behave as if nothing was saved.
    return null;
  }
};

/**
 * Saves a layout and notifies the subscribers.
 * @param layout Cards in display order.
 * @returns Whether the layout was saved.
 */
export const saveLayout = (layout: readonly GridCard[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    return false;
  }
  for (const listener of listeners) {
    listener();
  }
  return true;
};

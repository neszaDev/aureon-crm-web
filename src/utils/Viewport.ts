import { useSyncExternalStore } from 'react';

// Tailwind's `md`: from here the CRM shows its rail and sidebar; below, a top bar and a drawer.
const RAIL_SHOWN = '(width >= 48rem)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(RAIL_SHOWN);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
};

/**
 * Tells whether the CRM's rail is on screen (768 px and wider), for the controls that must exist
 * once (the reminders' reads, the ⌘K listener) but sit in the rail or in the phone's top bar.
 * Undefined on the server and while hydrating: both render, and CSS shows the right one.
 * @returns Whether the rail shows, once known.
 */
export const useRailShown = () =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(RAIL_SHOWN).matches,
    (): boolean | undefined => undefined,
  );

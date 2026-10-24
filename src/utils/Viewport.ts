import { useSyncExternalStore } from 'react';

/**
 * Tells whether the window is at least as wide as a media query says, once known: undefined on
 * the server and while hydrating, so both of a pair of controls render and CSS shows the right one.
 * @param query The query, such as `(width >= 48rem)`.
 * @returns Whether it matches, once known.
 */
const useWidth = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => {
        list.removeEventListener('change', onChange);
      };
    },
    () => window.matchMedia(query).matches,
    (): boolean | undefined => undefined,
  );

/**
 * Tells whether the window is a phone's (below 640 px; Tailwind's `sm`), where the bulk bar's
 * actions are icons whose names show in tooltips.
 * @returns Whether it is, once known.
 */
export const usePhone = () => useWidth('(width < 40rem)');

/**
 * Tells whether the CRM's rail is on screen (768 px and wider; Tailwind's `md`), for the controls
 * that must exist once (the reminders' reads, the ⌘K listener) but sit in the rail or in the
 * phone's top bar.
 * @returns Whether the rail shows, once known.
 */
export const useRailShown = () => useWidth('(width >= 48rem)');

/**
 * Tells whether the record search is a field in the top bar (1024 px and wider; Tailwind's `lg`)
 * rather than the rail's icon.
 * @returns Whether the field shows, once known.
 */
export const useSearchField = () => useWidth('(width >= 64rem)');

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {
  // Nothing changes while the page lives: nothing to listen to.
};
const isApple = () => /Mac|iPhone|iPad/u.test(navigator.userAgent);

/**
 * Tells whether shortcuts are written with ⌘ (Apple devices) rather than Ctrl. On the server and
 * while hydrating it is Ctrl.
 * @returns Whether the device is Apple's.
 */
export const useIsApple = () => useSyncExternalStore(subscribe, isApple, () => false);

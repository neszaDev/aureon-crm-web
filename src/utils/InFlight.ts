import { useRef } from 'react';

/**
 * Tracks one request at a time for a dialog: a second submit before the first has answered is
 * dropped, and the dialog stays open meanwhile (closing would lose the answer: a refusal, or a
 * new record that a second try would duplicate). A ref, as state only catches up on the next render.
 * @returns `once` runs a request unless one is on its way; `busy` tells whether one is.
 */
export const useInFlight = () => {
  const inFlight = useRef(false);

  return {
    once: async (run: () => Promise<void>) => {
      if (inFlight.current) {
        return;
      }
      inFlight.current = true;
      try {
        await run();
      } finally {
        inFlight.current = false;
      }
    },
    busy: () => inFlight.current,
  };
};

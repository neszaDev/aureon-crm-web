import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { usePrefersReducedMotion } from './ReducedMotion';

const Probe = () => <output>{usePrefersReducedMotion() ? 'reduced' : 'motion'}</output>;

// Only what the hook reads of a media query list.
const prefer = (reduce: boolean) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener: vi.fn<() => void>(),
    removeEventListener: vi.fn<() => void>(),
  }));
};

describe(usePrefersReducedMotion, () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('says the visitor asked for reduced motion', async () => {
    prefer(true);
    await render(<Probe />);

    await expect.element(page.getByRole('status')).toHaveTextContent('reduced');
  });

  it('says motion is fine otherwise', async () => {
    prefer(false);
    await render(<Probe />);

    await expect.element(page.getByRole('status')).toHaveTextContent('motion');
  });
});

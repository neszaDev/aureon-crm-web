import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { StampBox } from './StampBox';

describe(StampBox, () => {
  it('keeps the seal and the days out of a link name, which its label gives', async () => {
    await render(
      <>
        <a href="#profile">
          <StampBox seal="NP">
            <span className="sr-only">Done</span>
          </StampBox>
          Your profile
        </a>
        <a href="#deal">
          <StampBox days="8d">
            <span className="sr-only">Open for 8 days</span>
          </StampBox>
          Deal
        </a>
      </>,
    );

    // Inline spans join without a space; what matters is that "NP" and "8d" aren't read.
    await expect.element(page.getByRole('link', { name: /^Done ?Your profile$/u })).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: /^Open for 8 days ?Deal$/u }))
      .toBeVisible();
  });
});

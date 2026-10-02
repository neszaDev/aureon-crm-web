import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { DemoCarousel } from './DemoCarousel';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

describe(DemoCarousel, () => {
  it('goes to the slide whose indicator is pressed', async () => {
    await render(withIntl(<DemoCarousel picture={<span>Crest</span>} />));

    await page.getByRole('button', { name: 'Go to slide 3' }).click();

    await expect
      .element(page.getByRole('button', { name: 'Go to slide 3' }))
      .toHaveAttribute('aria-current', 'true');
    await expect.element(page.getByText('Slide 3 of 3')).toBeVisible();
  });

  it('loops from the first slide back to the last with the previous arrow', async () => {
    await render(withIntl(<DemoCarousel picture={<span>Crest</span>} />));

    await page.getByRole('button', { name: 'Previous slide' }).click();

    await expect.element(page.getByText('Slide 3 of 3')).toBeVisible();
  });

  it('pauses and resumes autoplay with its button', async () => {
    await render(withIntl(<DemoCarousel picture={<span>Crest</span>} />));

    await page.getByRole('button', { name: 'Pause' }).click();
    await expect.element(page.getByRole('button', { name: 'Play' })).toBeVisible();

    await page.getByRole('button', { name: 'Play' }).click();
    await expect.element(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  });
});

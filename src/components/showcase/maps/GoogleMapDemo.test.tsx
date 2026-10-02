import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { GoogleMapDemo } from './GoogleMapDemo';

describe(GoogleMapDemo, () => {
  describe('Without an API key', () => {
    it('explains how to set the key and still lists the places', async () => {
      await render(
        <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
          <GoogleMapDemo />
        </NextIntlClientProvider>,
      );

      await expect
        .element(page.getByRole('heading', { name: 'The map needs a Google Maps key' }))
        .toBeVisible();
      await expect.element(page.getByText('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')).toBeVisible();
      await expect
        .element(page.getByRole('link', { name: 'Website of Stanford' }))
        .toHaveAttribute('href', 'https://www.stanford.edu/');
      await expect
        .element(page.getByRole('button', { name: 'Show on map' }).first())
        .not.toBeInTheDocument();
    });
  });
});

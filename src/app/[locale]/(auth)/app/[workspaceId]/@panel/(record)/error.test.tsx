import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import PanelErrorPage from './error';

describe('the record panel’s error boundary', () => {
  it('says the record failed inside the panel, and loads it again on request', async () => {
    const retry = vi.fn<() => void>();
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <PanelErrorPage error={new Error('Boom')} retry={retry} />
      </NextIntlClientProvider>,
    );

    await expect
      .element(page.getByRole('heading', { level: 1, name: 'Something went wrong' }))
      .toBeVisible();
    await page.getByRole('button', { name: 'Try again' }).click();

    expect(retry).toHaveBeenCalledOnce();
  });
});

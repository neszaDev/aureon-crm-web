import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { FieldError } from './FieldError';

describe(FieldError, () => {
  it('writes the error in words with an icon, never in colour alone', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <FieldError id="name-error" error={{ type: 'too_small', message: 'required' }} />
      </NextIntlClientProvider>,
    );

    const alert = page.getByRole('alert');
    await expect.element(alert).toHaveTextContent('Required');
    expect(alert.element().querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  });
});

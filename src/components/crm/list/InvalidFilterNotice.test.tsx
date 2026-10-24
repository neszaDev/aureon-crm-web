import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { InvalidFilterNotice } from './InvalidFilterNotice';

describe(InvalidFilterNotice, () => {
  it('explains the refused filters and links to the list without them', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <InvalidFilterNotice resetHref="/app/1/companies" />
      </NextIntlClientProvider>,
    );

    await expect
      .element(page.getByRole('heading', { name: "These filters can't be used together" }))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Reset the list' }))
      .toHaveAttribute('href', '/app/1/companies');
  });

  it('says what the page gives it to say, as the reports do of an owner they refuse', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <InvalidFilterNotice
          resetHref="/app/1/reports?tab=funnel"
          messages={{ title: 'Title', text: 'Text', reset: 'Clear it' }}
        />
      </NextIntlClientProvider>,
    );

    await expect.element(page.getByRole('heading', { name: 'Title' })).toBeVisible();
    await expect.element(page.getByText('Text', { exact: true })).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Clear it' }))
      .toHaveAttribute('href', '/app/1/reports?tab=funnel');
  });
});

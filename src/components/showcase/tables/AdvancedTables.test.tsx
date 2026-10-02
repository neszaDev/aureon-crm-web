import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import messages from '@/locales/en.json';
import { BackendTable } from './BackendTable';
import { SelectTable } from './SelectTable';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

describe(BackendTable, () => {
  it('sends the filter on Enter, shows the loading overlay, then the answer', async () => {
    await render(withIntl(<BackendTable />));

    await expect.element(page.getByRole('button', { name: 'Page 5' })).toBeVisible();

    await page.getByRole('searchbox', { name: 'Filter', exact: true }).fill('banned');
    await userEvent.keyboard('{Enter}');

    await expect.element(page.getByRole('status', { name: 'Loading' })).toBeVisible();
    await expect.element(page.getByRole('status', { name: 'Loading' })).not.toBeInTheDocument();
    await expect.element(page.getByRole('cell', { name: 'Zbyněk Phoibos' })).toBeVisible();
    await expect.element(page.getByRole('cell', { name: 'Samppa Nori' })).not.toBeInTheDocument();
    await expect.element(page.getByRole('button', { name: 'Page 2' })).not.toBeInTheDocument();
  });
});

describe(SelectTable, () => {
  it('filters by the localized status and counts the selected rows', async () => {
    await render(withIntl(<SelectTable />));

    await page.getByRole('searchbox', { name: 'Filter by Status' }).fill('pending');
    await page.getByRole('checkbox', { name: 'Select all rows' }).click();

    await expect.element(page.getByText('5 rows selected')).toBeVisible();
  });
});

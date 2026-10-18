import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { KpiStrip } from './KpiStrip';

type Props = Parameters<typeof KpiStrip>[0];

// A fixed response: every figure must show as the API sent it.
const COUNTS: Props['counts'] = {
  companies: 12,
  contacts: 1234,
  openLeads: 9,
  openDeals: 16,
  overdueTasks: 8,
};

const strip = async (counts: Props['counts'], locale: 'en' | 'fr' = 'en') =>
  await render(
    <NextIntlClientProvider locale={locale} messages={locale === 'fr' ? fr : en} timeZone="UTC">
      <KpiStrip counts={counts} workspaceId={7} />
    </NextIntlClientProvider>,
  );

describe(KpiStrip, () => {
  it('shows each count as the API sent it, under its label', async () => {
    await strip(COUNTS);

    const figures = page
      .getByRole('link')
      .elements()
      .map((link) => link.textContent);
    expect(figures).toStrictEqual([
      'Companies 12',
      'Contacts 1,234',
      'Open leads 9',
      'Open deals 16',
      'Overdue tasks 8',
    ]);
  });

  it('links each count to the list it counts', async () => {
    await strip(COUNTS);

    await expect
      .element(page.getByRole('link', { name: 'Companies 12' }))
      .toHaveAttribute('href', '/app/7/companies');
    await expect
      .element(page.getByRole('link', { name: 'Contacts 1,234' }))
      .toHaveAttribute('href', '/app/7/contacts');
    // The open statuses, as the leads list takes them.
    await expect
      .element(page.getByRole('link', { name: 'Open leads 9' }))
      .toHaveAttribute('href', '/app/7/leads?status=NEW&status=CONTACTED&status=QUALIFIED');
    await expect
      .element(page.getByRole('link', { name: 'Open deals 16' }))
      .toHaveAttribute('href', '/app/7/deals?view=list&status=OPEN');
    await expect
      .element(page.getByRole('link', { name: 'Overdue tasks 8' }))
      .toHaveAttribute('href', '/app/7/tasks?view=overdue');
  });

  it('shows zeros as zeros, and marks late tasks with words and an icon, not colour alone', async () => {
    await strip({ ...COUNTS, companies: 0, overdueTasks: 0 });

    await expect.element(page.getByRole('link', { name: 'Companies 0' })).toBeVisible();
    const none = page.getByRole('link', { name: 'Overdue tasks 0' }).element();
    expect(none.querySelector('svg')).toBeNull();

    await strip(COUNTS);
    const late = page.getByRole('link', { name: 'Overdue tasks 8' }).element();
    expect(late.querySelector('svg')).not.toBeNull();
  });

  it('writes the figures in the page language', async () => {
    await strip(COUNTS, 'fr');

    await expect.element(page.getByRole('link', { name: /Contacts.*1.234/u })).toBeVisible();
    await expect.element(page.getByRole('link', { name: /Prospects ouverts/u })).toBeVisible();
  });
});

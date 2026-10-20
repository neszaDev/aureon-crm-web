import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { ActivityReport } from './ActivityReport';

type Props = Parameters<typeof ActivityReport>[0];

// A fixed response: most in total first (the API's order), the members who left last.
const REPORT: Props['report'] = {
  period: { from: '2026-09-19', to: '2026-10-18' },
  byUser: [
    {
      user: { userId: 7, displayName: 'Riley Rep', email: 'riley@demo.test' },
      calls: 12,
      emails: 8,
      meetings: 3,
      notes: 5,
      tasksCompleted: 9,
    },
    {
      user: { userId: 8, email: 'sam@demo.test' },
      calls: 1,
      emails: 0,
      meetings: 0,
      notes: 2,
      tasksCompleted: 0,
    },
    { calls: 0, emails: 4, meetings: 0, notes: 0, tasksCompleted: 1 },
  ],
};

const report = async (value: Props['report'], locale: 'en' | 'fr' = 'en') =>
  await render(
    <NextIntlClientProvider locale={locale} messages={locale === 'fr' ? fr : en} timeZone="UTC">
      <ActivityReport report={value} />
    </NextIntlClientProvider>,
  );

// What a cell says: the seal's initials are decoration, not part of a name.
const textOf = (cell: Element | null) => {
  const copy = cell?.cloneNode(true);
  if (!(copy instanceof Element)) {
    return '';
  }
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) {
    hidden.remove();
  }

  return copy.textContent;
};
const rows = () =>
  page
    .getByRole('row')
    .elements()
    .slice(1)
    .map((row) => [...row.children].map(textOf));

describe(ActivityReport, () => {
  it('lists the members in the order the API sent, each count as sent and the row total', async () => {
    await report(REPORT);

    expect(rows()).toStrictEqual([
      ['Riley Rep', '12', '8', '3', '5', '9', '37'],
      ['sam@demo.test', '1', '0', '0', '2', '0', '3'],
      ['Former members', '0', '4', '0', '0', '1', '5'],
    ]);
  });

  it('heads the columns by type', async () => {
    await report(REPORT);

    const heads = page
      .getByRole('columnheader')
      .elements()
      .map((head) => head.textContent);
    expect(heads).toStrictEqual([
      'Member',
      'Calls',
      'Emails',
      'Meetings',
      'Notes',
      'Tasks completed',
      'Total',
    ]);
  });

  it('signs each member with a seal and the former members with none', async () => {
    await report(REPORT);

    const seals = page
      .getByRole('row')
      .elements()
      .slice(1)
      .map((row) => row.querySelector('th [aria-hidden="true"]')?.textContent);
    expect(seals).toStrictEqual(['RR', 'SA', '']);
  });

  it('adds no total row: the API gave none', async () => {
    await report(REPORT);

    expect(rows()).toHaveLength(3);
    expect(page.getByRole('row', { name: /^Total/u }).elements()).toHaveLength(0);
  });

  it('says so when nobody did anything in the period', async () => {
    await report({ ...REPORT, byUser: [] });

    await expect.element(page.getByText('No activity in this period.')).toBeVisible();
    expect(document.querySelector('table')).toBeNull();
  });

  it('heads the columns in the page language', async () => {
    await report(REPORT, 'fr');

    await expect.element(page.getByRole('columnheader', { name: 'Appels' })).toBeVisible();
    expect(rows()[2]?.[0]).toBe('Anciens membres');
  });
});

import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { ActivityReport } from './ActivityReport';
import '@/styles/global.css';

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
      total: 37,
    },
    {
      user: { userId: 8, email: 'sam@demo.test' },
      calls: 1,
      emails: 0,
      meetings: 0,
      notes: 2,
      tasksCompleted: 0,
      total: 3,
    },
    { calls: 0, emails: 4, meetings: 0, notes: 0, tasksCompleted: 1, total: 5 },
  ],
};

const MIA = { userId: 12, displayName: 'Mia Rossi', email: 'mia@demo.test' };

const report = async (value: Props['report'], locale: 'en' | 'fr' = 'en', owner?: Props['owner']) =>
  await render(
    <NextIntlClientProvider locale={locale} messages={locale === 'fr' ? fr : en} timeZone="UTC">
      <ActivityReport report={value} owner={owner} />
    </NextIntlClientProvider>,
  );

// What a cell says: the avatar's initials are decoration, not part of a name.
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

// The fade at the table's right edge: it shows (1) while more columns are there to scroll to.
const fadeOpacity = () =>
  getComputedStyle(document.querySelector('.scroll-fade') ?? document.body).opacity;

describe(ActivityReport, () => {
  it('fades its right edge on a phone while columns are hidden, until the last is in view', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <div style={{ width: 358 }}>
          <ActivityReport report={REPORT} />
        </div>
      </NextIntlClientProvider>,
    );
    const region = page.getByRole('region', { name: 'Activity table' }).element();

    expect(region.scrollWidth).toBeGreaterThan(region.clientWidth);
    await expect.poll(fadeOpacity).toBe('1');

    region.scrollTo({ left: region.scrollWidth });

    await expect.poll(fadeOpacity).toBe('0');
  });

  it('shows no fade where every column fits', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={en} timeZone="UTC">
        <div style={{ width: 900 }}>
          <ActivityReport report={REPORT} />
        </div>
      </NextIntlClientProvider>,
    );
    const region = page.getByRole('region', { name: 'Activity table' }).element();

    expect(region.scrollWidth).toBe(region.clientWidth);
    expect(fadeOpacity()).toBe('0');
  });

  it('lists the members in the order the API sent, each count as sent and the row total', async () => {
    await report(REPORT);

    expect(rows()).toStrictEqual([
      ['Riley Rep', '12', '8', '3', '5', '9', '37'],
      ['sam@demo.test', '1', '0', '0', '2', '0', '3'],
      ['Former members', '0', '4', '0', '0', '1', '5'],
    ]);
  });

  it("shows each row's total as the API sent it, never a sum of its own", async () => {
    const [riley, ...rest] = REPORT.byUser;
    if (!riley) {
      throw new Error('The fixture has rows');
    }
    await report({ ...REPORT, byUser: [{ ...riley, total: 40 }, ...rest] });

    expect(rows()[0]?.at(-1)).toBe('40');
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

  it('shows each member with an avatar and the former members with none', async () => {
    await report(REPORT);

    const avatars = page
      .getByRole('row')
      .elements()
      .slice(1)
      .map((row) => row.querySelector('th [aria-hidden="true"]')?.textContent);
    expect(avatars).toStrictEqual(['RR', 'SA', '']);
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

  it('names the member it counts when they did nothing in the period', async () => {
    await report({ ...REPORT, byUser: [] }, 'en', MIA);

    await expect.element(page.getByText('No activity by Mia Rossi in this period.')).toBeVisible();
  });

  it('heads the columns in the page language', async () => {
    await report(REPORT, 'fr');

    await expect.element(page.getByRole('columnheader', { name: 'Appels' })).toBeVisible();
    expect(rows()[2]?.[0]).toBe('Anciens membres');
  });
});

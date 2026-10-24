import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { PipelineReport } from './PipelineReport';

type Props = Parameters<typeof PipelineReport>[0];

const stage = (id: number, name: string): Props['report']['byStage'][number]['stage'] => ({
  id,
  name,
  kind: 'OPEN',
  position: id,
  probability: 10 * id,
  dealCount: 0,
  version: 1,
});

// A fixed response: the owners as the API orders them (largest single amount first, the
// unassigned deals last among equals), one of them with two currencies.
const REPORT: Props['report'] = {
  byStage: [
    {
      stage: stage(1, 'Qualification'),
      count: 4,
      totals: [
        { currency: 'EUR', amount: '17000.00' },
        { currency: 'USD', amount: '50000.00' },
      ],
    },
    { stage: stage(2, 'Proposal'), count: 0, totals: [] },
  ],
  byOwner: [
    {
      owner: { userId: 7, displayName: 'Riley Rep', email: 'riley@demo.test' },
      count: 3,
      totals: [
        { currency: 'EUR', amount: '17000.00' },
        { currency: 'USD', amount: '50000.00' },
      ],
    },
    {
      owner: { userId: 8, email: 'sam@demo.test' },
      count: 1,
      totals: [{ currency: 'EUR', amount: '900.00' }],
    },
    { count: 2, totals: [{ currency: 'USD', amount: '250.00' }] },
  ],
};

const MIA = { userId: 12, displayName: 'Mia Rossi', email: 'mia@demo.test' };

const report = async (value: Props['report'], locale: 'en' | 'fr' = 'en', owner?: Props['owner']) =>
  await render(
    <NextIntlClientProvider locale={locale} messages={locale === 'fr' ? fr : en} timeZone="UTC">
      <PipelineReport report={value} owner={owner} />
    </NextIntlClientProvider>,
  );

const owners = (name = 'Open deals by owner') => page.getByRole('table', { name });
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
const ownerRows = () =>
  owners()
    .getByRole('row')
    .elements()
    .slice(1)
    .map((row) => [...row.children].map(textOf));

describe(PipelineReport, () => {
  it('lists the owners in the order the API sent, with their counts and each currency apart', async () => {
    await report(REPORT);

    expect(ownerRows()).toStrictEqual([
      ['Riley Rep', '3', '€17,000.00$50,000.00'],
      ['sam@demo.test', '1', '€900.00'],
      ['Unassigned', '2', '$250.00'],
    ]);
  });

  it('shows each owner with an avatar and the unassigned deals with none', async () => {
    await report(REPORT);

    const rows = owners().getByRole('row').elements().slice(1);
    // The avatar is decorative; the unassigned row holds a blank of its size, so the words line up.
    expect(rows.map((row) => row.querySelector('[aria-hidden="true"]')?.textContent)).toStrictEqual(
      ['RR', 'SA', ''],
    );
  });

  it('never adds across currencies or owners', async () => {
    await report(REPORT);

    const text = document.body.textContent;
    // EUR 17,000.00 + 900.00, USD 50,000.00 + 250.00, and the two currencies together.
    for (const sum of ['17,900', '50,250', '67,000', '67,900', '68,150']) {
      expect(text).not.toContain(sum);
    }
  });

  it('shows the stages with their counts, the empty one too, and the table of the bars', async () => {
    await report(REPORT);

    await expect.element(page.getByRole('heading', { name: 'Open deals by stage' })).toBeVisible();
    await expect.element(page.getByRole('row', { name: /Qualification/u })).toHaveTextContent('4');
    await expect.element(page.getByRole('row', { name: /Proposal/u })).toHaveTextContent('None');
    expect(
      document.querySelector('[data-slot="chart"]')?.closest('[aria-hidden="true"]'),
    ).not.toBeNull();
    // The table has a button to hide it, as under every chart, and starts open.
    await expect
      .element(page.getByRole('button', { name: 'Table', exact: true }))
      .toHaveAttribute('aria-expanded', 'true');
  });

  it('says so when no deal is open', async () => {
    await report({ byStage: [], byOwner: [] });

    await expect.element(page.getByText('No open stages.')).toBeVisible();
    await expect.element(page.getByText('No open deals.')).toBeVisible();
  });

  it('names the owner when they have no open deal', async () => {
    await report({ byStage: [], byOwner: [] }, 'en', MIA);

    await expect.element(page.getByText('No open deals owned by Mia Rossi.')).toBeVisible();
  });

  it('writes the unassigned row in the page language', async () => {
    await report(REPORT, 'fr');

    const rows = owners('Affaires en cours par propriétaire').getByRole('row').elements().slice(1);
    expect(rows.map((row) => textOf(row.querySelector('th')))).toContain('Sans propriétaire');
  });
});

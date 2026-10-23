import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { FunnelReport } from './FunnelReport';

type Props = Parameters<typeof FunnelReport>[0];

const stage = (
  id: number,
  name: string,
  kind: 'OPEN' | 'WON' = 'OPEN',
): Props['report']['stages'][number]['stage'] => ({
  id,
  name,
  kind,
  position: id,
  probability: 10 * id,
  dealCount: 0,
  version: 1,
});

// A fixed response: 20 deals created from 1 to 30 September, five stages in.
const REPORT: Props['report'] = {
  period: { from: '2026-09-01', to: '2026-09-30' },
  created: 20,
  historyFrom: '2026-08-15',
  stages: [
    { stage: stage(1, 'Qualification'), reached: 18 },
    { stage: stage(2, 'Proposal'), reached: 11 },
    { stage: stage(3, 'Negotiation'), reached: 0 },
    { stage: stage(4, 'Won', 'WON'), reached: 4 },
  ],
};

const funnel = async (report: Props['report'], locale: 'en' | 'fr' = 'en') =>
  await render(
    <NextIntlClientProvider locale={locale} messages={locale === 'fr' ? fr : en} timeZone="UTC">
      <FunnelReport report={report} />
    </NextIntlClientProvider>,
  );

const CAUTION = /Stage history starts on/u;

describe(FunnelReport, () => {
  it('shows a caution when the stage history starts after the period does', async () => {
    await funnel({ ...REPORT, historyFrom: '2026-09-10' });

    await expect
      .element(
        page.getByText(
          'Stage history starts on Sep 10, 2026; deals created before it count only the stages recorded since.',
        ),
      )
      .toBeVisible();
  });

  it('says there are no stage changes yet when the workspace has no history', async () => {
    const { historyFrom: _none, ...bare } = REPORT;
    await funnel(bare);

    await expect.element(page.getByText('No stage changes yet.')).toBeVisible();
    expect(document.body.textContent).not.toMatch(CAUTION);
  });

  it('shows no caution when the history reaches back to the period or further', async () => {
    await funnel({ ...REPORT, historyFrom: '2026-09-01' });

    expect(document.body.textContent).not.toMatch(CAUTION);
    expect(document.body.textContent).not.toContain('No stage changes yet');
  });

  it('writes the caution day in the page language', async () => {
    await funnel({ ...REPORT, historyFrom: '2026-09-10' }, 'fr');

    await expect
      .element(
        page.getByText("L'historique des étapes commence le 10 sept. 2026", { exact: false }),
      )
      .toBeVisible();
  });

  it('lists the stages in order with how many reached each of the deals created, as sent', async () => {
    await funnel(REPORT);

    await expect.element(page.getByText('20 deals created')).toBeVisible();
    const rows = page
      .getByRole('row')
      .elements()
      .slice(1)
      .map((row) => [row.querySelector('th')?.textContent, row.querySelector('td')?.textContent]);
    expect(rows).toStrictEqual([
      ['Qualification', '18 of 20'],
      ['Proposal', '11 of 20'],
      ['Negotiation', '0 of 20'],
      ['Won', '4 of 20'],
    ]);
  });

  it('draws a bar for each stage, hidden from assistive technology, never a number of its own', async () => {
    await funnel(REPORT);

    const bars = [...document.querySelectorAll('[data-bar]')];
    expect(bars.map((bar) => bar.getAttribute('aria-hidden'))).toStrictEqual([
      'true',
      'true',
      'true',
      'true',
    ]);
    expect(
      bars.map((bar) => bar.firstElementChild?.getAttribute('style') ?? '').map((s) => s.trim()),
    ).toStrictEqual(['width: 90%;', 'width: 55%;', 'width: 0%;', 'width: 20%;']);
    // Each in its stage's colour: the open ones walk blue to amber, Won is green.
    const fills = [...document.querySelectorAll<HTMLElement>('[data-bar] > [data-tone]')];
    expect(fills.map((fill) => fill.dataset.tone)).toStrictEqual([
      'blue',
      'violet',
      'amber',
      'green',
    ]);
  });

  it('says so when no deal was created in the period', async () => {
    await funnel({
      ...REPORT,
      created: 0,
      stages: REPORT.stages.map((s) => ({ ...s, reached: 0 })),
    });

    await expect.element(page.getByText('No deals were created in this period.')).toBeVisible();
    expect(document.querySelector('table')).toBeNull();
  });

  it('labels the figures in the page language', async () => {
    await funnel(REPORT, 'fr');

    await expect.element(page.getByText('20 affaires créées')).toBeVisible();
    await expect.element(page.getByRole('cell', { name: '18 sur 20' })).toBeVisible();
  });
});

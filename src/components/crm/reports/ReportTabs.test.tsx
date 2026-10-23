import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { ReportTabs } from './ReportTabs';

type Props = Parameters<typeof ReportTabs>[0];

const tabs = async (props: Partial<Props> = {}, locale: 'en' | 'fr' = 'en') =>
  await render(
    <NextIntlClientProvider locale={locale} messages={locale === 'fr' ? fr : en} timeZone="UTC">
      <ReportTabs current="funnel" path="/app/7/reports" period={{}} {...props} />
    </NextIntlClientProvider>,
  );

describe(ReportTabs, () => {
  it('has a link for each report, in order, the current one marked', async () => {
    await tabs();

    const links = page.getByRole('link').elements();
    expect(links.map((link) => link.textContent)).toStrictEqual([
      'Pipeline',
      'Won and lost',
      'Funnel',
      'Activities',
      'Follow-ups',
    ]);
    expect(links.map((link) => link.getAttribute('href'))).toStrictEqual([
      '/app/7/reports?tab=pipeline',
      '/app/7/reports?tab=won-lost',
      '/app/7/reports?tab=funnel',
      '/app/7/reports?tab=activities',
      '/app/7/reports?tab=follow-ups',
    ]);
    expect(links.map((link) => link.getAttribute('aria-current'))).toStrictEqual([
      null,
      null,
      'page',
      null,
      null,
    ]);
    await expect.element(page.getByRole('navigation', { name: 'Reports' })).toBeVisible();
  });

  it('keeps the period the page is showing from tab to tab', async () => {
    await tabs({ period: { from: '2026-09-01', to: '2026-09-30' } });

    await expect
      .element(page.getByRole('link', { name: 'Activities' }))
      .toHaveAttribute('href', '/app/7/reports?tab=activities&from=2026-09-01&to=2026-09-30');
  });

  it('marks the current tab with an underline as well as its colour', async () => {
    await tabs();

    await expect
      .element(page.getByRole('link', { name: 'Funnel' }))
      .toHaveClass('border-violet-ink', 'text-foreground');
    await expect
      .element(page.getByRole('link', { name: 'Pipeline' }))
      .toHaveClass('border-transparent');
  });

  it('names the tabs in the page language', async () => {
    await tabs({}, 'fr');

    await expect.element(page.getByRole('link', { name: 'Gagnées et perdues' })).toBeVisible();
    await expect.element(page.getByRole('navigation', { name: 'Rapports' })).toBeVisible();
  });
});

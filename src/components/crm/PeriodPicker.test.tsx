import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { PeriodPicker } from './PeriodPicker';

type Props = Parameters<typeof PeriodPicker>[0];

const push = vi.hoisted(() => vi.fn<(href: string, options?: { scroll: boolean }) => void>());
// The links stay real; only the router is the test's.
// @ts-expect-error -- only what the picker uses
vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({ push }),
}));

const TODAY = '2026-10-18';
const base = (props: Partial<Props> = {}): Props => ({
  period: { from: '2026-09-19', to: '2026-10-18' },
  path: '/app/1',
  params: {},
  today: TODAY,
  timeZone: 'Asia/Bangkok',
  ...props,
});

const picker = async (props: Props, locale: 'en' | 'fr' = 'en') =>
  await render(
    <NextIntlClientProvider locale={locale} messages={locale === 'fr' ? fr : en} timeZone="UTC">
      <PeriodPicker {...props} />
    </NextIntlClientProvider>,
  );

const link = (name: string) => page.getByRole('link', { name });

describe(PeriodPicker, () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("labels the period with the response's, whatever the URL asked for", async () => {
    // The page asked for nothing; the API answered with the default 30 days.
    await picker(base());

    await expect
      .element(page.getByRole('button', { name: 'Period: Sep 19 – Oct 18, 2026' }))
      .toBeVisible();
  });

  it('shows another period as the API gave it, across years too', async () => {
    await picker(base({ period: { from: '2025-12-20', to: '2026-01-18' } }));

    await expect
      .element(page.getByRole('button', { name: 'Period: Dec 20, 2025 – Jan 18, 2026' }))
      .toBeVisible();
  });

  it('offers the presets as links, counted in the workspace zone, and marks the current one', async () => {
    await picker(base({ params: { tab: 'funnel' } }));
    await page.getByRole('button', { name: /^Period/u }).click();

    await expect
      .element(link('Last 7 days'))
      .toHaveAttribute('href', '/app/1?tab=funnel&from=2026-10-12&to=2026-10-18');
    // The default period needs no dates in the URL.
    await expect.element(link('Last 30 days')).toHaveAttribute('href', '/app/1?tab=funnel');
    await expect
      .element(link('Last 90 days'))
      .toHaveAttribute('href', '/app/1?tab=funnel&from=2026-07-21&to=2026-10-18');
    await expect
      .element(link('This month'))
      .toHaveAttribute('href', '/app/1?tab=funnel&from=2026-10-01&to=2026-10-18');
    await expect
      .element(link('Last month'))
      .toHaveAttribute('href', '/app/1?tab=funnel&from=2026-09-01&to=2026-09-30');
    // The response's period is the last 30 days: that one is current.
    await expect.element(link('Last 30 days')).toHaveAttribute('aria-current', 'true');
    expect(link('Last 7 days').element().getAttribute('aria-current')).toBeNull();
    await expect.element(page.getByText('Days run in Asia/Bangkok time.')).toBeVisible();
  });

  it('applies a custom range, and refuses one the API would', async () => {
    await picker(base({ period: { from: '2026-10-01', to: '2026-10-18' } }));
    await page.getByRole('button', { name: /^Period/u }).click();

    // From the 1st: the 1st is where it starts; pick the 5th as the end.
    await page.getByRole('button', { name: /^To/u }).click();
    await page.getByRole('button', { name: /\b5th/u }).click();
    await page.getByRole('button', { name: 'Apply' }).click();

    expect(push).toHaveBeenCalledExactlyOnceWith('/app/1?from=2026-10-01&to=2026-10-05', {
      scroll: false,
    });

    push.mockClear();
    // A start after the end: nothing to apply, and the reason is written.
    await page.getByRole('button', { name: /^Period/u }).click();
    await page.getByRole('button', { name: /^From/u }).click();
    await page.getByRole('button', { name: /\b25th/u }).click();
    await expect
      .element(page.getByText('Choose a start on or before the end, at most 366 days apart.'))
      .toBeVisible();
    await expect.element(page.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(push).not.toHaveBeenCalled();
  });

  it('writes the period in the page language', async () => {
    await picker(base(), 'fr');

    await expect.element(page.getByRole('button', { name: /^Période : 19 sept/u })).toBeVisible();
  });
});

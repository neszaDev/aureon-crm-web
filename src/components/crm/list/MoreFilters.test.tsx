import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ListSpec } from '@/libs/crm/ListQuery';
import { parseListQuery } from '@/libs/crm/ListQuery';
import messages from '@/locales/en.json';
// The chip hides below 768 px, where its chips are listed flat: styles.
import '@/styles/global.css';
import { OptionsChip } from './FilterChip';
import { MoreFilters } from './MoreFilters';

const router = vi.hoisted(() => ({ push: vi.fn<(href: string) => void>() }));
// @ts-expect-error -- only what the chips use
vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => router,
}));

const SPEC = {
  sorts: ['NAME'],
  defaultSort: 'NAME',
  filters: { sourceId: 'id' },
} as const satisfies ListSpec;
const PATH = '/app/1/deals';

const renderMore = async (query: Record<string, string>) => {
  const parsed = parseListQuery(SPEC, query);
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <MoreFilters count={parsed.filters.sourceId === undefined ? 0 : 1}>
        <OptionsChip
          label="Source"
          anyLabel="Any source"
          missingLabel="Unknown source"
          param="sourceId"
          options={[{ value: '4', label: 'Trade show' }]}
          path={PATH}
          query={parsed}
        />
      </MoreFilters>
    </NextIntlClientProvider>,
  );
};

describe(MoreFilters, () => {
  beforeEach(async () => {
    router.push.mockClear();
    await page.viewport(1280, 800);
  });

  it('keeps its filters behind one chip, listed in its popover', async () => {
    await renderMore({});

    expect(page.getByRole('button', { name: 'Source' }).elements()).toHaveLength(0);

    await page.getByRole('button', { name: 'More filters' }).click();
    await page.getByRole('button', { name: 'Source' }).click();
    await page.getByRole('option', { name: 'Trade show' }).click();

    expect(router.push).toHaveBeenCalledExactlyOnceWith(`${PATH}?sourceId=4`, { scroll: false });
  });

  it('counts the filters it holds that are on, each still listed with its value and its ×', async () => {
    await renderMore({ sourceId: '4' });

    const more = page.getByRole('button', { name: 'More filters, 1 on' });
    await expect.element(more).toHaveTextContent('More1');

    await more.click();
    await expect.element(page.getByRole('button', { name: 'Source: Trade show' })).toBeVisible();
    await page.getByRole('button', { name: 'Clear the Source filter' }).click();

    expect(router.push).toHaveBeenCalledExactlyOnceWith(PATH, { scroll: false });
  });

  it('lists its filters flat on a phone, where the toolbar is a sheet', async () => {
    await page.viewport(390, 800);
    await renderMore({});

    await expect.element(page.getByRole('button', { name: 'Source' })).toBeVisible();
    expect(page.getByRole('button', { name: /^More filters/u }).elements()).toHaveLength(0);
  });
});

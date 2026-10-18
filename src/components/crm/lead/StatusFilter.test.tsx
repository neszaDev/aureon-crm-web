import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ListSpec } from '@/libs/crm/ListQuery';
import { parseListQuery } from '@/libs/crm/ListQuery';
import messages from '@/locales/en.json';
import { LEAD_STATUSES } from '@/validations/crm/LeadValidation';
import { StatusFilter } from './StatusFilter';

const router = vi.hoisted(() => ({ push: vi.fn<(href: string) => void>() }));
// @ts-expect-error -- only what the filter uses
vi.mock(import('@/libs/I18nNavigation'), () => ({ useRouter: () => router }));

const SPEC = {
  sorts: ['NAME'],
  defaultSort: 'NAME',
  filters: { status: { enum: LEAD_STATUSES, multiple: true } },
} as const satisfies ListSpec;
const PATH = '/app/1/leads';

const renderFilter = async (query: Record<string, string | string[]>) => {
  router.push.mockClear();
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <StatusFilter path={PATH} query={parseListQuery(SPEC, query)} />
    </NextIntlClientProvider>,
  );
};

const toggle = (name: string) => page.getByRole('button', { name, exact: true });

describe(StatusFilter, () => {
  it('shows the statuses in the URL as pressed', async () => {
    await renderFilter({ status: ['NEW', 'QUALIFIED'], size: '50' });

    await expect.element(toggle('New')).toHaveAttribute('aria-pressed', 'true');
    await expect.element(toggle('Qualified')).toHaveAttribute('aria-pressed', 'true');
    await expect.element(toggle('Contacted')).toHaveAttribute('aria-pressed', 'false');
  });

  it('adds a status to the ones on, keeping the other params and the first page', async () => {
    await renderFilter({ status: 'NEW', size: '50', page: '2' });

    await toggle('Contacted').click();

    expect(router.push).toHaveBeenCalledExactlyOnceWith(
      `${PATH}?status=NEW&status=CONTACTED&size=50`,
      {
        scroll: false,
      },
    );
  });

  it('drops the param when the last status is turned off', async () => {
    await renderFilter({ status: 'NEW' });

    await toggle('New').click();

    expect(router.push).toHaveBeenCalledExactlyOnceWith(PATH, { scroll: false });
  });
});

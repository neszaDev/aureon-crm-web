import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ListSpec } from '@/libs/crm/ListQuery';
import { parseListQuery } from '@/libs/crm/ListQuery';
import messages from '@/locales/en.json';
import { OptionsChip } from './FilterChip';

const router = vi.hoisted(() => ({ push: vi.fn<(href: string) => void>() }));
// The links stay real; only the router is the test's.
// @ts-expect-error -- only what the chip uses
vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => router,
}));

const SPEC = {
  sorts: ['NAME'],
  defaultSort: 'NAME',
  filters: { ownerId: 'id' },
} as const satisfies ListSpec;
const PATH = '/app/1/companies';

const renderChip = async (query: Record<string, string>) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <OptionsChip
        label="Owner"
        anyLabel="Anyone"
        missingLabel="Former member"
        param="ownerId"
        options={[
          { value: '3', label: 'Riley Rep', person: { email: 'riley@acme.test' } },
          { value: 'unassigned', label: 'Unassigned' },
        ]}
        path={PATH}
        query={parseListQuery(SPEC, { size: '50', ...query })}
      />
    </NextIntlClientProvider>,
  );
};

describe(OptionsChip, () => {
  it('chooses a value from its popover, keeping the other params', async () => {
    router.push.mockClear();
    await renderChip({});

    await page.getByRole('button', { name: 'Owner' }).click();
    await page.getByRole('option', { name: 'Riley Rep' }).click();

    expect(router.push).toHaveBeenCalledExactlyOnceWith(`${PATH}?size=50&ownerId=3`, {
      scroll: false,
    });
    await expect.element(page.getByRole('option', { name: 'Riley Rep' })).not.toBeInTheDocument();
  });

  it('shows the value it is on, and an × that clears it', async () => {
    await renderChip({ ownerId: '3' });

    await expect.element(page.getByRole('button', { name: 'Owner: Riley Rep' })).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Clear the Owner filter' }))
      .toHaveAttribute('href', `${PATH}?size=50`);
  });

  it('names a value the options no longer hold', async () => {
    await renderChip({ ownerId: '999' });

    await expect.element(page.getByRole('button', { name: 'Owner: Former member' })).toBeVisible();
  });

  it('marks the current option for assistive technology', async () => {
    await renderChip({});

    await page.getByRole('button', { name: 'Owner' }).click();

    await expect.element(page.getByRole('option', { name: 'Anyone (current)' })).toBeVisible();
    await page.getByRole('option', { name: 'Anyone' }).click();
    expect(router.push).toHaveBeenLastCalledWith(`${PATH}?size=50`, { scroll: false });
  });
});

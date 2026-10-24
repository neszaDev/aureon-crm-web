import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ListSpec } from '@/libs/crm/ListQuery';
import { parseListQuery } from '@/libs/crm/ListQuery';
import { FilterSelect } from './FilterSelect';

const router = vi.hoisted(() => ({ push: vi.fn<(href: string) => void>() }));
// @ts-expect-error -- only what the filter uses
vi.mock(import('@/libs/I18nNavigation'), () => ({ useRouter: () => router }));

const SPEC = {
  sorts: ['NAME'],
  defaultSort: 'NAME',
  filters: { ownerId: 'id' },
} as const satisfies ListSpec;

const renderFilter = async (query: Record<string, string>) => {
  await render(
    <FilterSelect
      id="owner"
      label="Owner"
      anyLabel="Anyone"
      missingLabel="Former member"
      param="ownerId"
      options={[{ value: '3', label: 'Riley Rep', person: { email: 'riley@acme.test' } }]}
      path="/app/1/companies"
      query={parseListQuery(SPEC, query)}
    />,
  );
};

describe(FilterSelect, () => {
  it('shows the chosen option', async () => {
    await renderFilter({ ownerId: '3' });

    await expect
      .element(page.getByRole('combobox', { name: 'Owner' }))
      .toHaveTextContent('Riley Rep');
  });

  it('names a value the options no longer hold instead of showing nothing', async () => {
    await renderFilter({ ownerId: '999' });

    await expect
      .element(page.getByRole('combobox', { name: 'Owner' }))
      .toHaveTextContent('Former member');
  });
});

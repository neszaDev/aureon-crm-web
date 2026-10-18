import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import type { ListSpec } from '@/libs/crm/ListQuery';
import { parseListQuery } from '@/libs/crm/ListQuery';
import { SearchBox } from './SearchBox';

const router = vi.hoisted(() => ({ replace: vi.fn<(href: string) => void>() }));
// @ts-expect-error -- only what the search box uses
vi.mock(import('@/libs/I18nNavigation'), () => ({ useRouter: () => router }));

const SPEC = { sorts: ['NAME'], defaultSort: 'NAME', filters: {} } as const satisfies ListSpec;
const PATH = '/app/1/companies';

const box = (query: Record<string, string>) => (
  <SearchBox id="search" label="Search" param="q" path={PATH} query={parseListQuery(SPEC, query)} />
);

describe(SearchBox, () => {
  it('replaces the URL once typing pauses, keeping the size and dropping the page', async () => {
    router.replace.mockClear();
    await render(box({ page: '3', size: '50' }));

    await userEvent.type(page.getByLabelText('Search'), 'acme');

    // One call in all: none for "a", "ac" or "acm", typed without a pause.
    await expect
      .poll(() => router.replace.mock.calls)
      .toEqual([[`${PATH}?size=50&q=acme`, { scroll: false }]]);
  });

  it('clears the search typed away before the first one landed', async () => {
    router.replace.mockClear();
    const screen = await render(box({}));
    const input = page.getByLabelText('Search');

    await input.fill('a');
    await expect.poll(() => router.replace.mock.lastCall?.[0]).toBe(`${PATH}?q=a`);
    await input.fill('');
    await expect.poll(() => router.replace.mock.lastCall?.[0]).toBe(PATH);

    // The first search lands late, then the cleared one.
    await screen.rerender(box({ q: 'a' }));
    await expect.element(input).toHaveValue('');
    await screen.rerender(box({}));
    await expect.element(input).toHaveValue('');
  });

  it('follows a change of the URL it did not ask for', async () => {
    const screen = await render(box({ q: 'acme' }));

    await expect.element(page.getByLabelText('Search')).toHaveValue('acme');
    await screen.rerender(box({}));
    await expect.element(page.getByLabelText('Search')).toHaveValue('');
  });
});

import { describe, expect, it, onTestFinished, vi } from 'vitest';
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
  it('stops at 200 characters, which the backend would refuse as invalid filters', async () => {
    await render(box({}));

    await expect.element(page.getByLabelText('Search')).toHaveAttribute('maxlength', '200');
  });

  it('replaces the URL once typing pauses, keeping the size and dropping the page', async () => {
    router.replace.mockClear();
    await render(box({ page: '3', size: '50' }));
    // The page's clock stands still while the keys arrive, however slowly a busy machine sends
    // them: typed without a pause, whatever the wall clock says.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    onTestFinished(() => {
      vi.useRealTimers();
    });

    await userEvent.type(page.getByLabelText('Search'), 'acme');
    vi.advanceTimersByTime(299);
    expect(router.replace).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);

    // One call in all: none for "a", "ac" or "acm".
    expect(router.replace.mock.calls).toStrictEqual([
      [`${PATH}?size=50&q=acme`, { scroll: false }],
    ]);
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

  it('asks nothing when typing comes back to the search the URL holds', async () => {
    router.replace.mockClear();
    // The URL changes without this box (Back): it holds "acme" from now on.
    const screen = await render(box({}));
    await screen.rerender(box({ q: 'acme' }));
    const input = page.getByLabelText('Search');
    await expect.element(input).toHaveValue('acme');

    await userEvent.type(input, 'x{Backspace}');
    // Past the typing pause, when a request would have gone.
    const { promise, resolve } = Promise.withResolvers<undefined>();
    setTimeout(resolve, 500);
    await promise;

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('asks again for a value typed back to while a later search is on its way', async () => {
    router.replace.mockClear();
    const screen = await render(box({}));
    const input = page.getByLabelText('Search');

    await input.fill('a');
    await expect.poll(() => router.replace.mock.lastCall?.[0]).toBe(`${PATH}?q=a`);
    await input.fill('ab');
    await expect.poll(() => router.replace.mock.lastCall?.[0]).toBe(`${PATH}?q=ab`);
    // "a" lands while "ab" is still on its way: the list would end on "ab".
    await screen.rerender(box({ q: 'a' }));
    await input.fill('a');

    await expect.poll(() => router.replace.mock.calls.length).toBe(3);
    expect(router.replace.mock.lastCall?.[0]).toBe(`${PATH}?q=a`);
  });

  it('follows a change of the URL it did not ask for', async () => {
    const screen = await render(box({ q: 'acme' }));

    await expect.element(page.getByLabelText('Search')).toHaveValue('acme');
    await screen.rerender(box({}));
    await expect.element(page.getByLabelText('Search')).toHaveValue('');
  });
});

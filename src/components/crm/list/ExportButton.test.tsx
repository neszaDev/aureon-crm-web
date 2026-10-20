import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { Toaster } from '@/components/ui/sonner';
import type { Permission } from '@/libs/crm/Permissions';
import messages from '@/locales/en.json';
import { ExportButton } from './ExportButton';

const router = vi.hoisted(() => ({ push: vi.fn<(href: string) => void>() }));
// @ts-expect-error -- only what the button uses
vi.mock(import('@/libs/I18nNavigation'), () => ({ useRouter: () => router }));

const CSV = '﻿Reference,Name\r\nC-0001,Acme\r\n';

const button = (
  params: Record<string, string | string[]> = {},
  permissions: Permission[] = ['EXPORT'],
) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <ExportButton workspaceId={7} permissions={permissions} list="companies" query={{ params }} />
    <Toaster />
  </NextIntlClientProvider>
);

const exportButton = () => page.getByRole('button', { name: 'Export CSV' });

// What the browser would download: the name of each link clicked for it.
const downloads = () => {
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockReturnValue();

  return () =>
    click.mock.contexts.map((link) => (link instanceof HTMLAnchorElement ? link.download : link));
};

const answer = (body: BodyInit | null, init: ResponseInit) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, init));

describe(ExportButton, () => {
  afterEach(() => {
    vi.restoreAllMocks();
    router.push.mockClear();
  });

  it('is not there for a role without EXPORT', async () => {
    await render(button({}, ['AUDIT_READ']));

    await expect.element(page.getByText('Export CSV')).not.toBeInTheDocument();
  });

  it("asks for the list's current filters, and saves the file under the server's name", async () => {
    const names = downloads();
    const fetch = answer(CSV, {
      headers: {
        'Content-Type': 'text/csv;charset=UTF-8',
        'Content-Disposition': 'attachment; filename="companies-2026-10-20.csv"',
      },
    });
    await render(button({ q: 'acme', ownerId: '4', sort: 'UPDATED_AT', size: '50' }));

    await exportButton().click();

    await expect.element(page.getByText('Saved companies-2026-10-20.csv')).toBeVisible();
    // The page's own state is sent; the route drops the paging and the sort.
    expect(fetch).toHaveBeenCalledExactlyOnceWith(
      '/api/crm/7/export/companies?q=acme&ownerId=4&sort=UPDATED_AT&size=50&locale=en',
    );
    expect(names()).toStrictEqual(['companies-2026-10-20.csv']);
  });

  it('falls back to the list name without a Content-Disposition', async () => {
    const names = downloads();
    answer(CSV, { headers: { 'Content-Type': 'text/csv' } });
    await render(button());

    await exportButton().click();

    await expect.element(page.getByText('Saved companies.csv')).toBeVisible();
    expect(names()).toStrictEqual(['companies.csv']);
  });

  it('toasts the translated refusal and downloads nothing when the backend refuses', async () => {
    const names = downloads();
    const create = vi.spyOn(URL, 'createObjectURL');
    answer(
      JSON.stringify({ message: 'Too many rows to export. Narrow the filters and try again.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
    await render(button());

    await exportButton().click();

    await expect
      .element(page.getByText('Too many rows to export. Narrow the filters and try again.'))
      .toBeVisible();
    expect(names()).toStrictEqual([]);
    expect(create).not.toHaveBeenCalled();
  });

  it('toasts a generic refusal when the answer is not the route JSON', async () => {
    const names = downloads();
    answer('<html>Bad gateway</html>', { status: 502 });
    await render(button());

    await exportButton().click();

    await expect.element(page.getByText("That didn't work. Try again.")).toBeVisible();
    expect(names()).toStrictEqual([]);
  });

  it('goes to sign in when the session is over, without a toast or a file', async () => {
    const names = downloads();
    answer(null, { status: 401 });
    await render(button());

    await exportButton().click();

    await vi.waitFor(() => {
      expect(router.push).toHaveBeenCalledExactlyOnceWith('/sign-in?expired=1');
    });
    expect(names()).toStrictEqual([]);
    expect(page.getByRole('status').elements()).toHaveLength(0);
  });

  it('toasts that the server cannot be reached, and downloads nothing', async () => {
    const names = downloads();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    await render(button());

    await exportButton().click();

    await expect
      .element(page.getByText("Couldn't reach the server. Check your connection and try again."))
      .toBeVisible();
    expect(names()).toStrictEqual([]);
  });

  it('downloads nothing when the file breaks off half way', async () => {
    const names = downloads();
    const create = vi.spyOn(URL, 'createObjectURL');
    const encoder = new TextEncoder();
    // The headers arrive, the first rows too, and then the connection drops.
    const broken = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('Reference,Name\r\nC-0001,Acme\r\n'));
      },
      pull(controller) {
        controller.error(new TypeError('network error'));
      },
    });
    answer(broken, {
      headers: {
        'Content-Type': 'text/csv;charset=UTF-8',
        'Content-Disposition': 'attachment; filename="companies-2026-10-20.csv"',
      },
    });
    await render(button());

    await exportButton().click();

    await expect
      .element(page.getByText("Couldn't reach the server. Check your connection and try again."))
      .toBeVisible();
    expect(names()).toStrictEqual([]);
    expect(create).not.toHaveBeenCalled();
    // Ready for another try.
    await expect.element(exportButton()).not.toHaveAttribute('aria-disabled');
  });

  it('shows it is working until the file is in, and does not ask twice', async () => {
    downloads();
    const { promise, resolve } = Promise.withResolvers<Response>();
    const fetch = vi.spyOn(globalThis, 'fetch').mockReturnValue(promise);
    await render(button());

    await exportButton().click();
    await expect.element(exportButton()).toHaveAttribute('aria-disabled', 'true');
    // Playwright won't click an aria-disabled button; a hurried user can.
    await exportButton().click({ force: true });

    expect(fetch).toHaveBeenCalledOnce();
    resolve(new Response(CSV, { headers: { 'Content-Type': 'text/csv' } }));
    await expect.element(exportButton()).not.toHaveAttribute('aria-disabled');
  });
});

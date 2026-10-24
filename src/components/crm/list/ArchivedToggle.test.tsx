import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ListSpec } from '@/libs/crm/ListQuery';
import { parseListQuery } from '@/libs/crm/ListQuery';
import messages from '@/locales/en.json';
import { ArchivedToggle } from './ArchivedToggle';

const SPEC = { sorts: ['NAME'], defaultSort: 'NAME', filters: {} } as const satisfies ListSpec;

describe(ArchivedToggle, () => {
  it('marks the current view with the muted fill and bold ink, never the violet', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <ArchivedToggle path="/app/1/companies" query={parseListQuery(SPEC, {})} />
      </NextIntlClientProvider>,
    );

    const current = page.getByRole('link', { name: 'Active' });
    const other = page.getByRole('link', { name: 'Archived' });

    await expect.element(current).toHaveAttribute('aria-current', 'page');
    await expect.element(current).toHaveClass('bg-muted', 'font-semibold', 'text-foreground');
    expect(current.element().getAttribute('class')).not.toMatch(/violet/u);
    expect(other.element().getAttribute('class')).not.toMatch(/bg-muted font-semibold/u);
  });
});

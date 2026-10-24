import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ListSpec } from '@/libs/crm/ListQuery';
import { parseListQuery } from '@/libs/crm/ListQuery';
import messages from '@/locales/en.json';
import { SortHeader } from './SortHeader';

const SPEC = {
  sorts: ['NAME', 'UPDATED_AT'],
  defaultSort: 'NAME',
  filters: {},
} as const satisfies ListSpec;
const PATH = '/app/1/companies';

const renderHeads = async (query: Record<string, string>) => {
  const parsed = parseListQuery(SPEC, query);
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <table>
        <thead>
          <tr>
            <SortHeader label="Name" sort="NAME" path={PATH} query={parsed} />
            <SortHeader label="Updated" sort="UPDATED_AT" path={PATH} query={parsed} />
          </tr>
        </thead>
      </table>
    </NextIntlClientProvider>,
  );
};

// The browser locator gives a header cell the `cell` role, as in MembersTable's test.
const head = (name: string) => page.getByRole('cell', { name, exact: true });

describe(SortHeader, () => {
  it('marks the sorted column, and sorts another in its own direction first', async () => {
    await renderHeads({ q: 'acme', page: '2' });

    await expect.element(head('Name')).toHaveAttribute('aria-sort', 'ascending');
    await expect.element(head('Updated')).not.toHaveAttribute('aria-sort');
    await expect
      .element(head('Updated').getByRole('link'))
      .toHaveAttribute('href', `${PATH}?q=acme&sort=UPDATED_AT`);
  });

  it('flips the sorted column the other way', async () => {
    await renderHeads({ sort: 'UPDATED_AT' });

    await expect.element(head('Updated')).toHaveAttribute('aria-sort', 'descending');
    await expect
      .element(head('Updated').getByRole('link'))
      .toHaveAttribute('href', `${PATH}?sort=UPDATED_AT&direction=ASC`);
  });

  it('flips a flipped column back to its own direction, without the param', async () => {
    await renderHeads({ direction: 'DESC' });

    await expect.element(head('Name')).toHaveAttribute('aria-sort', 'descending');
    await expect
      .element(head('Name').getByRole('link'))
      .toHaveAttribute('href', `${PATH}?sort=NAME`);
  });
});

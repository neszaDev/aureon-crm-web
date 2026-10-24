// A phone's row is laid out by the styles.
import '@/styles/global.css';
import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import type { ListQuery } from '@/libs/crm/ListQuery';
import messages from '@/locales/en.json';
import { CompanyTable } from './CompanyTable';

type Send = () => Promise<ActionResult>;

vi.mock(import('@/actions/crm/CompanyActions'), () => ({
  archiveCompany: vi.fn<Send>(),
  restoreCompany: vi.fn<Send>(),
}));

// Words without a break wider than a phone's name cell, as a pasted reference or a German compound
// can be.
const LONG = 'Donaudampfschifffahrtsgesellschaftskapitänswitwenrentenkasse';
const INDUSTRY = 'Elektrizitätswirtschaftsunternehmensberatungsgesellschaften';
const COMPANY: components['schemas']['CompanySummary'] = {
  id: 7,
  name: LONG,
  industry: INDUSTRY,
  owner: { userId: 2, email: 'mia@acme.test', displayName: 'Mia Rossi' },
  contactCount: 1,
  openDealCount: 0,
  archived: false,
  updatedAt: '2026-10-22T09:00:00Z',
};
const QUERY: ListQuery = { page: 0, size: 20, sort: 'NAME', filters: {}, params: {} };

const renderPhone = async () => {
  await page.viewport(390, 844);
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      {/* The canvas's 16 px sides on a phone. */}
      <div className="px-4">
        <CompanyTable
          rows={[COMPANY]}
          path="/app/1/companies"
          query={QUERY}
          timeZone="UTC"
          workspace={{ id: 1, permissions: ['RECORDS_EDIT_ANY'] }}
          me={1}
        />
      </div>
    </NextIntlClientProvider>,
  );
};

describe(CompanyTable, () => {
  afterEach(async () => {
    await page.viewport(414, 896);
  });

  it('keeps a long single word inside its cell on a phone', async () => {
    await renderPhone();
    const row = page.getByRole('row', { name: new RegExp(LONG, 'u') });
    const menu = row.getByRole('button', { name: `Actions for ${LONG}` }).element();
    const edge = menu.closest('td')?.getBoundingClientRect().left ?? 0;

    // Neither the name nor the industry runs over the menu's column, nor the page sideways.
    expect(
      row.getByRole('link', { name: LONG }).element().getBoundingClientRect().right,
    ).toBeLessThanOrEqual(edge);
    // The second line's, not the hidden column's.
    const industry = row
      .getByText(INDUSTRY)
      .elements()
      .find((element) => element.checkVisibility());
    expect(industry?.getBoundingClientRect().right).toBeLessThanOrEqual(edge);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
  });
});

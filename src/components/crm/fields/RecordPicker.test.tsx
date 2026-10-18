import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { searchRecords } from '@/actions/crm/RecordSearchActions';
import messages from '@/locales/en.json';
import type { PickedRecord } from './RecordPicker';
import { RecordPicker } from './RecordPicker';

vi.mock(import('@/actions/crm/RecordSearchActions'), () => ({
  searchRecords: vi.fn<typeof searchRecords>(),
}));

const CompanyField = (props: { initial: PickedRecord | null }) => {
  const [company, setCompany] = useState(props.initial);

  return (
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <label htmlFor="company">Company</label>
      <RecordPicker
        id="company"
        workspaceId={1}
        kind="company"
        value={company}
        onChange={setCompany}
      />
      <output data-testid="company">{company ? `${company.id}:${company.label}` : 'none'}</output>
    </NextIntlClientProvider>
  );
};

const trigger = () => page.getByRole('combobox', { name: 'Company' });
// The picker's own status, beside its list.
const status = () => page.getByRole('dialog').getByRole('status');

const pause = async (ms: number) => {
  const { promise, resolve } = Promise.withResolvers<undefined>();
  setTimeout(resolve, ms);
  await promise;
};

describe(RecordPicker, () => {
  it("shows the current record's name without searching", async () => {
    vi.mocked(searchRecords).mockClear();
    await render(<CompanyField initial={{ id: 7, label: 'Acme' }} />);

    await expect.element(trigger()).toHaveTextContent('Acme');
    expect(searchRecords).not.toHaveBeenCalled();
  });

  it('searches as the user types and picks a result', async () => {
    // Opening lists the first records; "glo", typed without a pause, is one search.
    vi.mocked(searchRecords)
      .mockReset()
      .mockResolvedValueOnce([{ id: 7, label: 'Acme' }])
      .mockResolvedValueOnce([{ id: 9, label: 'Globex', detail: 'https://globex.test' }]);
    await render(<CompanyField initial={null} />);

    await trigger().click();
    await expect.element(page.getByRole('option', { name: /Acme/u })).toBeVisible();
    await userEvent.keyboard('glo');
    await page.getByRole('option', { name: /Globex/u }).click();

    await expect.element(page.getByTestId('company')).toHaveTextContent('9:Globex');
    await expect.element(trigger()).toHaveTextContent('Globex');
    expect(searchRecords).toHaveBeenLastCalledWith(1, 'company', 'glo');
  });

  it('keeps the latest search when an earlier one answers last', async () => {
    const slow = Promise.withResolvers<{ id: number; label: string }[]>();
    vi.mocked(searchRecords)
      .mockReset()
      .mockReturnValueOnce(slow.promise)
      .mockResolvedValueOnce([{ id: 9, label: 'Globex' }]);
    await render(<CompanyField initial={null} />);

    await trigger().click();
    await userEvent.keyboard('glo');
    await expect.element(page.getByRole('option', { name: /Globex/u })).toBeVisible();
    slow.resolve([{ id: 7, label: 'Acme' }]);

    await expect.element(page.getByRole('option', { name: /Globex/u })).toBeVisible();
    expect(page.getByRole('option', { name: /Acme/u }).elements()).toHaveLength(0);
  });

  it('takes no Enter on the old results while a search is on its way', async () => {
    const slow = Promise.withResolvers<{ id: number; label: string }[]>();
    vi.mocked(searchRecords)
      .mockReset()
      .mockResolvedValueOnce([{ id: 7, label: 'Acme' }])
      .mockReturnValueOnce(slow.promise);
    await render(<CompanyField initial={null} />);

    await trigger().click();
    await expect.element(page.getByRole('option', { name: /Acme/u })).toBeVisible();
    // Enter at once, then again past the typing pause, before the answer.
    await userEvent.keyboard('glo{Enter}');
    await pause(400);
    await userEvent.keyboard('{Enter}');

    expect(page.getByTestId('company').element()).toHaveTextContent('none');
    await expect.element(page.getByText('Searching…')).toBeVisible();

    slow.resolve([{ id: 9, label: 'Globex' }]);
    await expect.element(page.getByRole('option', { name: /Globex/u })).toBeVisible();
    await userEvent.keyboard('{Enter}');

    await expect.element(page.getByTestId('company')).toHaveTextContent('9:Globex');
  });

  it('names its list and marks the current record', async () => {
    vi.mocked(searchRecords)
      .mockReset()
      .mockResolvedValueOnce([
        { id: 7, label: 'Acme' },
        { id: 9, label: 'Globex' },
      ]);
    await render(<CompanyField initial={{ id: 9, label: 'Globex' }} />);

    // ArrowDown on the closed field opens it, as on a select.
    trigger().element().focus();
    await userEvent.keyboard('{ArrowDown}');

    await expect.element(page.getByRole('dialog', { name: 'Search companies' })).toBeVisible();
    await expect.element(page.getByRole('listbox', { name: 'Results' })).toBeVisible();
    await expect.element(page.getByRole('option', { name: 'Globex (current)' })).toBeVisible();
    await expect.element(page.getByRole('option', { name: 'Acme', exact: true })).toBeVisible();
  });

  it('says how many results arrived', async () => {
    vi.mocked(searchRecords)
      .mockReset()
      .mockResolvedValueOnce([
        { id: 7, label: 'Acme' },
        { id: 8, label: 'Acme Logistics' },
        { id: 9, label: 'Globex' },
      ])
      .mockResolvedValueOnce([{ id: 9, label: 'Globex' }]);
    await render(<CompanyField initial={null} />);

    await trigger().click();
    await expect.element(status()).toHaveTextContent('3 results');

    await userEvent.keyboard('glo');
    await expect.element(status()).toHaveTextContent(/^1 result$/u);
  });

  it('says when nothing matches', async () => {
    vi.mocked(searchRecords).mockReset().mockResolvedValueOnce([]);
    await render(<CompanyField initial={null} />);

    await trigger().click();

    await expect.element(page.getByText('Nothing found')).toBeVisible();
  });

  it('says when the search failed, rather than that nothing matches', async () => {
    vi.mocked(searchRecords).mockReset().mockRejectedValueOnce(new Error('403'));
    await render(<CompanyField initial={null} />);

    await trigger().click();

    await expect.element(page.getByText("Couldn't search. Try again.")).toBeVisible();
    expect(page.getByText('Nothing found').elements()).toHaveLength(0);
  });

  it('clears the record', async () => {
    await render(<CompanyField initial={{ id: 7, label: 'Acme' }} />);

    await page.getByRole('button', { name: 'Clear company' }).click();

    await expect.element(page.getByTestId('company')).toHaveTextContent('none');
    await expect.element(trigger()).toHaveTextContent('None');
  });
});

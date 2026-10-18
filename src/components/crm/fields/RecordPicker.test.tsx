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

  it('clears the record', async () => {
    await render(<CompanyField initial={{ id: 7, label: 'Acme' }} />);

    await page.getByRole('button', { name: 'Clear company' }).click();

    await expect.element(page.getByTestId('company')).toHaveTextContent('none');
    await expect.element(trigger()).toHaveTextContent('None');
  });
});

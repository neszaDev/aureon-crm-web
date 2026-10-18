import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { LeadLifecycle } from './LeadLifecycle';

const renderRow = async (props: {
  status: Parameters<typeof LeadLifecycle>[0]['status'];
  reason?: string;
}) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <LeadLifecycle {...props} />
    </NextIntlClientProvider>,
  );
};

const states = () =>
  page
    .getByRole('listitem')
    .elements()
    .map((item) => item.textContent.trim());

describe(LeadLifecycle, () => {
  it('shows the stages before the current one as reached', async () => {
    await renderRow({ status: 'CONTACTED' });

    await expect.element(page.getByRole('list', { name: 'Lead lifecycle' })).toBeVisible();
    expect(states()).toStrictEqual([
      expect.stringContaining('New: reached'),
      expect.stringContaining('Contacted: current'),
      expect.stringContaining('Qualified: not reached'),
      expect.stringContaining('Converted: not reached'),
    ]);
  });

  it('shows every stage reached once converted', async () => {
    await renderRow({ status: 'CONVERTED' });

    expect(states().every((text) => text.includes(': reached'))).toBeTruthy();
  });

  it('closes an unqualified lead with the Unqualified box and its reason', async () => {
    await renderRow({ status: 'UNQUALIFIED', reason: 'Budget too small' });

    expect(states()).toStrictEqual([
      expect.stringContaining('New: not reached'),
      expect.stringContaining('Contacted: not reached'),
      expect.stringContaining('Qualified: not reached'),
      expect.stringContaining('Unqualified: current'),
    ]);
    await expect.element(page.getByText('Budget too small')).toBeVisible();
  });
});

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

  it('fills the segments up to the current one, in the colour of its status', async () => {
    await renderRow({ status: 'CONTACTED' });

    const bars = page
      .getByRole('listitem')
      .elements()
      .map((item) => item.querySelector('span')?.className);

    expect(bars.map((bar) => bar?.includes('bg-(--tone)'))).toStrictEqual([
      true,
      true,
      false,
      false,
    ]);
    expect(page.getByRole('list').element().closest('[data-tone]')).toHaveAttribute(
      'data-tone',
      'violet',
    );
  });

  it('shows every stage reached once converted', async () => {
    await renderRow({ status: 'CONVERTED' });

    expect(states().every((text) => text.includes(': reached'))).toBeTruthy();
  });

  it('closes an unqualified lead with the Unqualified box and its reason', async () => {
    await renderRow({ status: 'UNQUALIFIED', reason: 'Budget too small' });

    expect(states()).toStrictEqual([
      expect.stringContaining('New: not shown'),
      expect.stringContaining('Contacted: not shown'),
      expect.stringContaining('Qualified: not shown'),
      expect.stringContaining('Unqualified: current'),
    ]);
    await expect.element(page.getByText('Budget too small')).toBeVisible();
  });
});

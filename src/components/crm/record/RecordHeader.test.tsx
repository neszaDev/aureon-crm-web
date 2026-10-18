import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { DealStatusBadge } from '@/components/crm/deal/DealStatusBadge';
import messages from '@/locales/en.json';
import { RecordHeader } from './RecordHeader';

const header = (status: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <RecordHeader
      number="D-0042"
      name="Acme renewal"
      headingId="heading"
      archived={false}
      status={status}
    />
  </NextIntlClientProvider>
);

describe(RecordHeader, () => {
  it("shows a deal's status as its DealStatusBadge, in the status's ink", async () => {
    await render(header(<DealStatusBadge status="WON" />));

    await expect.element(page.getByText('Won')).toHaveClass('text-success');
    // The badge as it is, not one wrapped in a second.
    expect(document.querySelectorAll('[data-slot="badge"]')).toHaveLength(1);
  });

  it('shows a status word in a plain outlined badge', async () => {
    await render(header('Completed'));

    const badge = page.getByText('Completed');

    await expect.element(badge).toBeVisible();
    expect(badge.element().getAttribute('class')).not.toMatch(/text-(info|success)/u);
  });
});

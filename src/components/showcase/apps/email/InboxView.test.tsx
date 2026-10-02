import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { InboxView } from './InboxView';
import { MailboxProvider } from './MailboxProvider';

const renderInbox = async () => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <MailboxProvider>
        <InboxView folder="inbox" />
      </MailboxProvider>
    </NextIntlClientProvider>,
  );
};

describe(InboxView, () => {
  it('shows the unread count in the sidebar and the first page range', async () => {
    await renderInbox();

    await expect.element(page.getByLabelText('4 unread')).toBeVisible();
    await expect.element(page.getByText('1–10 of 13')).toBeVisible();
  });

  it('marks the selected message as read, which lowers the unread count', async () => {
    await renderInbox();

    await page.getByRole('checkbox', { name: 'Select “Term report templates are ready”' }).click();
    await page.getByRole('button', { name: 'Mark as read' }).click();

    await expect.element(page.getByLabelText('3 unread')).toBeVisible();
  });

  it('opens compose with the reply prefilled', async () => {
    await renderInbox();

    await page.getByRole('checkbox', { name: 'Select “Sports day volunteers”' }).click();

    await expect
      .element(page.getByRole('link', { name: 'Reply', exact: true }))
      .toHaveAttribute('href', expect.stringContaining('subject=Re%3A+Sports+day+volunteers'));
  });

  it('archives the selected messages out of the inbox', async () => {
    await renderInbox();

    await page.getByRole('checkbox', { name: 'Select all messages on this page' }).click();
    await page.getByRole('button', { name: 'Archive' }).click();

    await expect.element(page.getByText('1–3 of 3')).toBeVisible();
  });
});

import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { MailboxProvider } from './MailboxProvider';
import { MessageView } from './MessageView';

// The message view moves between messages with the router, which isn't mounted here.
// @ts-expect-error -- only what the message view uses of the router
vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({ push: vi.fn<(href: string) => void>() }),
}));

describe(MessageView, () => {
  it('clears the reply once sent, and sends another with what was typed next', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <MailboxProvider>
          <MessageView folder="inbox" />
        </MailboxProvider>
      </NextIntlClientProvider>,
    );
    const reply = page.getByRole('textbox', { name: 'Reply' });
    const send = page.getByRole('button', { name: 'Send reply' });

    await reply.fill('First answer');
    await send.click();
    await expect.element(reply).toHaveValue('');
    await reply.fill('Second answer');
    await send.click();

    // Sent, not refused as empty: the box is clear again and says nothing is missing.
    await expect.element(reply).toHaveValue('');
    expect(page.getByText('Required').elements()).toHaveLength(0);
  });
});

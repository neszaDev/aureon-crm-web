import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { MessageDialog } from './MessageDialog';

describe(MessageDialog, () => {
  it('shows the message with its code and reports the pressed button', async () => {
    const onAction = vi.fn<(code: string) => void>();
    const onOpenChange = vi.fn<(open: boolean) => void>();
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <MessageDialog
          open
          onOpenChange={onOpenChange}
          content={{ title: 'Error', message: 'The code has expired.', number: '1', code: '40100' }}
          buttons={[
            { code: 'cancel', label: 'Cancel' },
            { code: 'retry', label: 'Try again', variant: 'default' },
          ]}
          onAction={onAction}
        />
      </NextIntlClientProvider>,
    );

    const dialog = page.getByRole('dialog', { name: 'Error' });

    await expect.element(dialog.getByText('The code has expired.')).toBeVisible();
    await expect.element(dialog.getByText('# 1-40100')).toBeVisible();

    await dialog.getByRole('button', { name: 'Try again' }).click();

    expect(onAction).toHaveBeenCalledWith('retry');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

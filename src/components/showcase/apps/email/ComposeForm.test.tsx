import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { ComposeForm } from './ComposeForm';
import { MailboxProvider } from './MailboxProvider';

const renderCompose = async (props: React.ComponentProps<typeof ComposeForm> = {}) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <MailboxProvider>
        <ComposeForm {...props} />
      </MailboxProvider>
    </NextIntlClientProvider>,
  );
};

describe(ComposeForm, () => {
  it('asks for a recipient before sending', async () => {
    await renderCompose();

    await page.getByRole('button', { name: 'Send' }).click();

    await expect.element(page.getByText('Required')).toBeVisible();
  });

  it('rejects a malformed address in Cc', async () => {
    await renderCompose();

    await page.getByLabelText('To').fill('ada@example.com');
    await page.getByLabelText('Cc', { exact: true }).fill('not-an-address');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect
      .element(page.getByText('Enter valid email addresses, separated by commas'))
      .toBeVisible();
  });

  it('starts prefilled for a reply and clears the form once sent', async () => {
    await renderCompose({ defaultTo: 'ada@example.com', defaultSubject: 'Re: Hello' });
    const subject = page.getByLabelText('Subject');

    await expect.element(subject).toHaveValue('Re: Hello');

    await page.getByRole('button', { name: 'Send' }).click();

    await expect.element(subject).toHaveValue('');
    await expect.element(page.getByLabelText('To')).toHaveValue('');
  });

  it('formats the message body from the toolbar', async () => {
    await renderCompose();
    const bold = page.getByRole('button', { name: 'Bold' });

    await page.getByRole('textbox', { name: 'Message' }).click();
    await bold.click();

    await expect.element(bold).toHaveAttribute('aria-pressed', 'true');
  });

  it('sends a second message from the cleared form, with what was typed next', async () => {
    await renderCompose();
    const to = page.getByLabelText('To');
    const subject = page.getByLabelText('Subject');

    await to.fill('ada@example.com');
    await subject.fill('First');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect.element(subject).toHaveValue('');
    await to.fill('grace@example.com');
    await subject.fill('Second');
    await page.getByRole('button', { name: 'Send' }).click();

    await expect.element(subject).toHaveValue('');
    await expect.element(to).toHaveValue('');
    expect(page.getByText('Required').elements()).toHaveLength(0);
  });
});

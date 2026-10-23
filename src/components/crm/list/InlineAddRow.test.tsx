import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { Toaster } from '@/components/ui/sonner';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import { InlineAddRow } from './InlineAddRow';

// Its real module needs Next's runtime; the field mode never links.
// @ts-expect-error -- a stand-in link
vi.mock(import('@/libs/I18nNavigation'), () => ({ Link: () => null }));

const renderRow = async (action: (name: string) => Promise<ActionResult>) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <InlineAddRow label="Add company" placeholder="Add company" action={action} />
      <Toaster />
    </NextIntlClientProvider>,
  );

  return page.getByRole('textbox', { name: 'Add company' });
};

describe(InlineAddRow, () => {
  it('creates the trimmed name on Enter, then clears for the next one', async () => {
    const action = vi.fn<(name: string) => Promise<ActionResult>>().mockResolvedValue({ ok: true });
    const field = await renderRow(action);

    await userEvent.type(field, '  Brightwater  {Enter}');

    expect(action).toHaveBeenCalledExactlyOnceWith('Brightwater');
    await expect.element(field).toHaveValue('');
    await expect.element(field).toHaveFocus();
    await expect.element(page.getByText('Brightwater added')).toBeInTheDocument();
  });

  it('shows a refusal under the row and keeps the text to fix', async () => {
    const action = vi
      .fn<(name: string) => Promise<ActionResult>>()
      .mockResolvedValue({ ok: false, fieldErrors: { name: 'Too long' } });
    const field = await renderRow(action);

    await userEvent.type(field, 'Brightwater{Enter}');

    await expect.element(page.getByRole('alert')).toHaveTextContent('Too long');
    await expect.element(field).toHaveAttribute('aria-invalid', 'true');
    await expect.element(field).toHaveAccessibleDescription('Too long');
    await expect.element(field).toHaveValue('Brightwater');

    // Typing again clears it.
    await userEvent.type(field, 's');
    await expect.element(page.getByRole('alert')).not.toBeInTheDocument();
  });

  it("shows the message, not another field's bare error, for a refusal off the name", async () => {
    const action = vi.fn<(name: string) => Promise<ActionResult>>().mockResolvedValue({
      ok: false,
      message: 'Check the industry.',
      fieldErrors: { industry: 'Too long' },
    });
    const field = await renderRow(action);

    await userEvent.type(field, 'Brightwater{Enter}');

    await expect.element(page.getByRole('alert')).toHaveTextContent('Check the industry.');
  });

  it('asks for a name rather than sending an empty one', async () => {
    const action = vi.fn<(name: string) => Promise<ActionResult>>();
    const field = await renderRow(action);

    await userEvent.type(field, '   {Enter}');

    expect(action).not.toHaveBeenCalled();
    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Type a name, then press Enter.');
  });

  it('waits for the server, read-only, before the next name', async () => {
    const answer = Promise.withResolvers<ActionResult>();
    const action = vi.fn<(name: string) => Promise<ActionResult>>(async () => await answer.promise);
    const field = await renderRow(action);

    await userEvent.type(field, 'Brightwater{Enter}');
    await expect.element(field).toHaveAttribute('readonly');
    await userEvent.keyboard('{Enter}');
    expect(action).toHaveBeenCalledOnce();

    answer.resolve({ ok: true });
    await expect.element(field).not.toHaveAttribute('readonly');
    await expect.element(field).toHaveValue('');
  });

  it('sends the second value with the name, from either field', async () => {
    const action = vi
      .fn<(name: string, extra?: string) => Promise<ActionResult>>()
      .mockResolvedValue({ ok: true });
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <InlineAddRow
          label="Add lead"
          placeholder="Name"
          extra={{ label: 'Company', placeholder: 'Company (optional)' }}
          action={action}
        />
        <Toaster />
      </NextIntlClientProvider>,
    );

    await userEvent.type(page.getByRole('textbox', { name: 'Add lead' }), 'Noa Park');
    await userEvent.type(page.getByRole('textbox', { name: 'Company' }), ' Acme {Enter}');

    expect(action).toHaveBeenCalledExactlyOnceWith('Noa Park', 'Acme');
    await expect.element(page.getByRole('textbox', { name: 'Company' })).toHaveValue('');
  });
});

// The phone's layout is the styles'.
import '@/styles/global.css';
import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const renderLeadRow = async (action: (name: string, extra?: string) => Promise<ActionResult>) =>
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

describe(InlineAddRow, () => {
  beforeEach(async () => {
    await page.viewport(1024, 768);
  });

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

  it("leaves the second value to the record's form on a phone, the row the name's", async () => {
    await page.viewport(390, 844);
    const action = vi
      .fn<(name: string, extra?: string) => Promise<ActionResult>>()
      .mockResolvedValue({ ok: true });
    await renderLeadRow(action);
    const name = page.getByRole('textbox', { name: 'Add lead' });

    await expect.element(page.getByRole('textbox', { name: 'Company' })).not.toBeInTheDocument();
    // The whole row but its icon and padding.
    expect(name.element().getBoundingClientRect().width).toBeGreaterThan(300);
    await userEvent.type(name, 'Noa Park{Enter}');
    expect(action).toHaveBeenCalledExactlyOnceWith('Noa Park', '');
  });

  it('marks the second field with a refusal too', async () => {
    const action = vi
      .fn<(name: string, extra?: string) => Promise<ActionResult>>()
      .mockResolvedValue({ ok: false, message: 'Company name too long.' });
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <InlineAddRow
          label="Add lead"
          placeholder="Name"
          extra={{ label: 'Company', placeholder: 'Company (optional)' }}
          action={action}
        />
      </NextIntlClientProvider>,
    );
    const company = page.getByRole('textbox', { name: 'Company' });

    await userEvent.type(page.getByRole('textbox', { name: 'Add lead' }), 'Noa');
    await userEvent.type(company, 'Acme{Enter}');

    await expect.element(company).toHaveAttribute('aria-invalid', 'true');
    await expect.element(company).toHaveAccessibleDescription('Company name too long.');
  });

  it('clears for the next one and says what it has to say when it was made with a caveat', async () => {
    const action = vi
      .fn<(name: string) => Promise<ActionResult>>()
      .mockResolvedValue({ ok: true, message: 'Added as New: the move was refused.' });
    const field = await renderRow(action);

    await userEvent.type(field, 'Noa{Enter}');

    await expect.element(field).toHaveValue('');
    const note = page.getByRole('alert');
    await expect.element(note).toHaveTextContent('Added as New: the move was refused.');
    // A note, not a fault of the cleared field: neither invalid nor in the error's red.
    await expect.element(field).not.toHaveAttribute('aria-invalid');
    expect(note.element()).not.toHaveClass('text-destructive');
    // Enter again sends nothing: the field is empty, not a second copy of the lead.
    await userEvent.keyboard('{Enter}');
    expect(action).toHaveBeenCalledOnce();
  });
});

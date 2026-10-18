import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import type { ActivityFormValues } from '@/validations/crm/ActivityValidation';
import { ActivityComposer } from './ActivityComposer';

type Save = (values: ActivityFormValues, whenChanged: boolean) => Promise<ActionResult>;

const renderForm = async (result: ActionResult) => {
  const save = vi.fn<Save>().mockResolvedValue(result);
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <ActivityComposer
        defaults={{ type: 'CALL', subject: '', body: '', occurredAt: '2026-10-18T10:00' }}
        timeZone="UTC"
        save={save}
        savedMessage="Activity logged"
        submitLabel="Log"
      />
    </NextIntlClientProvider>,
  );
  await page.getByLabelText('Subject').fill('Called Pat');

  return save;
};

// The time field's value, which "When" shows.
const timeValue = () => {
  const input = page.getByLabelText('time').element();

  return input instanceof HTMLInputElement ? input.value : undefined;
};
// What the clock reads, in the form's zone (UTC): this minute, or the one before it.
const clock = (offsetMs: number) => new Date(Date.now() + offsetMs).toISOString().slice(11, 16);

const renderComposer = async (result: ActionResult) => {
  await renderForm(result);
  await page.getByRole('button', { name: 'Log' }).click();
};

describe(ActivityComposer, () => {
  it('says what the backend said about the links, not only to check the fields', async () => {
    await renderComposer({
      ok: false,
      message: 'Check the highlighted fields and try again.',
      fieldErrors: { links: 'Link the activity to a company, contact, lead or deal' },
    });

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('Link the activity to a company, contact, lead or deal');
    expect(
      page.getByText('Check the highlighted fields', { exact: false }).elements(),
    ).toHaveLength(0);
  });

  it("shows the refusal's own message when no links error comes with it", async () => {
    await renderComposer({ ok: false, message: 'You can only edit your own activities.' });

    await expect
      .element(page.getByRole('alert'))
      .toHaveTextContent('You can only edit your own activities.');
  });

  it('clears the subject and details each time it is logged, and puts "When" back to now', async () => {
    const save = await renderForm({ ok: true });
    await page.getByLabelText('Details').fill('Wants a quote');
    await page.getByLabelText('time').fill('14:30');
    await page.getByRole('button', { name: 'Log' }).click();

    await expect.element(page.getByLabelText('Subject')).toHaveValue('');
    await expect.element(page.getByLabelText('Details')).toHaveValue('');
    expect(save).toHaveBeenLastCalledWith(
      {
        type: 'CALL',
        subject: 'Called Pat',
        body: 'Wants a quote',
        occurredAt: '2026-10-18T14:30',
      },
      true,
    );
    // Not the 14:30 typed, nor the time the form was opened with: now.
    await expect
      .poll(timeValue)
      .toSatisfy((value: string) => [clock(0), clock(-60_000)].includes(value));

    await page.getByLabelText('Subject').fill('Sent the quote');
    await page.getByLabelText('Details').fill('Valid for 30 days');
    await page.getByRole('button', { name: 'Log' }).click();

    await expect.element(page.getByLabelText('Subject')).toHaveValue('');
    await expect.element(page.getByLabelText('Details')).toHaveValue('');
    // The second log carries what was typed since, and "When" untouched is left to the backend.
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith(
      expect.objectContaining({
        subject: 'Sent the quote',
        body: 'Valid for 30 days',
        type: 'CALL',
      }),
      false,
    );
  });
});

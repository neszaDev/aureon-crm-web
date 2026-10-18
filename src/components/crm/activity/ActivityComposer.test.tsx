import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import { ActivityComposer } from './ActivityComposer';

const renderForm = async (result: ActionResult) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <ActivityComposer
        defaults={{ type: 'CALL', subject: '', body: '', occurredAt: '2026-10-18T10:00' }}
        timeZone="UTC"
        save={async () => await Promise.resolve(result)}
        savedMessage="Activity logged"
        submitLabel="Log"
      />
    </NextIntlClientProvider>,
  );
  await page.getByLabelText('Subject').fill('Called Pat');
};

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

  it('clears the subject and details once logged, ready for the next activity', async () => {
    await renderForm({ ok: true });
    await page.getByLabelText('Details').fill('Wants a quote');
    await page.getByRole('button', { name: 'Log' }).click();

    await expect.element(page.getByLabelText('Subject')).toHaveValue('');
    await expect.element(page.getByLabelText('Details')).toHaveValue('');
  });
});

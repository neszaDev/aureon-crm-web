import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { createTestResult } from '@/actions/TestResultActions';
import messages from '@/locales/en.json';
import { TestResultForm } from './TestResultForm';

vi.mock(import('@/actions/TestResultActions'), () => ({
  createTestResult: vi.fn<typeof createTestResult>().mockResolvedValue({ ok: true }),
}));

const add = async (name: string, score: string) => {
  await page.getByLabelText('Test name').fill(name);
  await page.getByLabelText('Score').fill(score);
  await page.getByLabelText('Tested at').fill('2026-10-18T10:00');
  await page.getByRole('button', { name: 'Add' }).click();
};

describe(TestResultForm, () => {
  it('clears the fields once added, and adds another with the new values', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <TestResultForm />
      </NextIntlClientProvider>,
    );

    await add('Login', '90');
    await expect.element(page.getByText('Added to your card.')).toBeVisible();
    await expect.element(page.getByLabelText('Test name')).toHaveValue('');
    await add('Logout', '75');

    await expect.element(page.getByLabelText('Test name')).toHaveValue('');
    await vi.waitFor(() => {
      expect(createTestResult).toHaveBeenCalledTimes(2);
    });
    expect(createTestResult).toHaveBeenLastCalledWith(
      expect.objectContaining({ testName: 'Logout', score: 75 }),
    );
  });
});

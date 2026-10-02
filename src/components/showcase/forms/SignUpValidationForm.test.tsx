import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { SignUpValidationForm } from './SignUpValidationForm';

const renderForm = async () =>
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <SignUpValidationForm />
    </NextIntlClientProvider>,
  );

const fillValidForm = async () => {
  await page.getByLabelText('First name').fill('Ada');
  await page.getByLabelText('Last name').fill('Lovelace');
  await page.getByLabelText('User name').fill('adalove');
  await page.getByLabelText('Email').fill('ada@example.com');
  await page.getByLabelText('Password', { exact: true }).fill('Report1card');
  await page.getByLabelText('Confirm password').fill('Report1card');
  await page.getByRole('checkbox', { name: 'I accept the terms of use' }).click();
};

describe(SignUpValidationForm, () => {
  describe('While editing', () => {
    it('shows a field error only once that field is edited', async () => {
      await renderForm();

      await expect.element(page.getByText('Use at least 3 characters')).not.toBeInTheDocument();

      await page.getByLabelText('First name').fill('Al');

      await expect.element(page.getByText('Use at least 3 characters')).toBeVisible();
      await expect.element(page.getByLabelText('Last name')).not.toHaveAttribute('aria-invalid');
    });

    it('flags a confirmation that stops matching the password', async () => {
      await renderForm();

      await page.getByLabelText('Password', { exact: true }).fill('Report1card');
      await page.getByLabelText('Confirm password').fill('Report1card');
      await page.getByLabelText('Password', { exact: true }).fill('Report2card');

      await expect.element(page.getByText('Passwords must match')).toBeVisible();
    });
  });

  describe('Validate button', () => {
    it('reveals every rule the empty form breaks', async () => {
      await renderForm();

      await page.getByRole('button', { name: 'Validate' }).click();

      await expect.element(page.getByText('You must accept before submitting')).toBeVisible();
      await expect
        .element(page.getByLabelText('First name'))
        .toHaveAttribute('aria-invalid', 'true');
    });
  });

  describe('Submitting', () => {
    it('enables submit only for a valid form, then marks the values submitted', async () => {
      await renderForm();
      const submit = page.getByRole('button', { name: 'Submit' });

      await expect.element(submit).toBeDisabled();

      await fillValidForm();
      await expect.element(submit).toBeEnabled();
      await submit.click();

      await expect.element(page.getByRole('heading', { name: 'Submitted values' })).toBeVisible();
      await expect.element(submit).toBeDisabled();
    });

    it('resets the form to empty values', async () => {
      await renderForm();
      await fillValidForm();

      await page.getByRole('button', { name: 'Reset' }).click();

      await expect.element(page.getByLabelText('First name')).toHaveValue('');
      await expect.element(page.getByRole('button', { name: 'Reset' })).toBeDisabled();
      await expect.element(page.getByRole('heading', { name: 'Form values' })).toBeVisible();
    });
  });
});

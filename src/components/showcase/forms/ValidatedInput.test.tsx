import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { passesRule, ValidatedInput } from './ValidatedInput';

describe(passesRule, () => {
  it('accepts anything when optional and rejects blanks when required', () => {
    expect(passesRule('', 'optional')).toBeTruthy();
    expect(passesRule('  ', 'required')).toBeFalsy();
  });

  it('checks the length and email rules', () => {
    expect(passesRule('abc', 'min_length_4')).toBeFalsy();
    expect(passesRule('abcd', 'min_length_4')).toBeTruthy();
    expect(passesRule('ada@example', 'email')).toBeFalsy();
    expect(passesRule('ada@example.com', 'email')).toBeTruthy();
  });
});

describe(ValidatedInput, () => {
  it('switches from the invalid to the valid feedback as you type', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <ValidatedInput
          id="nickname"
          label="Nickname"
          rule="min_length_4"
          validFeedback="Looks good"
          invalidFeedback="Too short"
        />
      </NextIntlClientProvider>,
    );
    const input = page.getByLabelText('Nickname');

    await expect.element(input).toHaveAttribute('aria-invalid', 'true');
    await expect.element(page.getByText('Too short')).toBeVisible();

    await input.fill('Robin');

    await expect.element(input).not.toHaveAttribute('aria-invalid');
    await expect.element(page.getByText('Looks good')).toBeVisible();
  });
});

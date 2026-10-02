import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { US_STATES } from '@/components/showcase/forms/data';
import messages from '@/locales/en.json';
import { Combobox, toggleSelection } from './Combobox';

const StatesField = (props: { multiple?: boolean }) => {
  const [value, setValue] = useState<string[]>([]);

  return (
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <span id="states-label">States</span>
      <Combobox
        id="states"
        labelId="states-label"
        options={US_STATES}
        value={value}
        onValueChange={setValue}
        multiple={props.multiple}
        clearable
        placeholder="Select option"
      />
      <output data-testid="value">{value.join(',')}</output>
    </NextIntlClientProvider>
  );
};

describe(toggleSelection, () => {
  it('adds and removes values of a multiple selection', () => {
    expect(toggleSelection(['AL'], 'CA', true)).toStrictEqual(['AL', 'CA']);
    expect(toggleSelection(['AL', 'CA'], 'AL', true)).toStrictEqual(['CA']);
  });

  it('keeps one value in a single selection', () => {
    expect(toggleSelection(['AL'], 'CA', false)).toStrictEqual(['CA']);
    expect(toggleSelection(['CA'], 'CA', false)).toStrictEqual(['CA']);
  });
});

describe(Combobox, () => {
  describe('Multiple', () => {
    it('adds searched options as chips and removes them again', async () => {
      await render(<StatesField multiple />);

      await page.getByRole('button', { name: /^States/u }).click();
      await userEvent.keyboard('calif');
      await page.getByRole('option', { name: 'California' }).click();
      await userEvent.keyboard('texas');
      await page.getByRole('option', { name: 'Texas' }).click();

      await expect.element(page.getByTestId('value')).toHaveTextContent('CA,TX');

      await userEvent.keyboard('{Escape}');
      await page.getByRole('button', { name: 'Remove California' }).click();

      await expect.element(page.getByTestId('value')).toHaveTextContent('TX');
      await expect
        .element(page.getByRole('button', { name: 'Remove California' }))
        .not.toBeInTheDocument();
    });

    it('does not pick a disabled option', async () => {
      await render(<StatesField multiple />);

      await page.getByRole('button', { name: /^States/u }).click();

      await expect
        .element(page.getByRole('option', { name: 'American Samoa' }))
        .toHaveAttribute('aria-disabled', 'true');
    });
  });

  describe('Single', () => {
    it('shows the chosen option, closes, and clears', async () => {
      await render(<StatesField />);

      await page.getByRole('button', { name: /^States/u }).click();
      await page.getByRole('option', { name: 'Alaska' }).click();

      await expect.element(page.getByRole('button', { name: 'States Alaska' })).toBeVisible();
      await expect.element(page.getByRole('option', { name: 'Alaska' })).not.toBeInTheDocument();

      await page.getByRole('button', { name: 'Clear selection' }).click();

      await expect.element(page.getByTestId('value')).toHaveTextContent('');
    });
  });
});

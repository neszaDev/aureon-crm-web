import { NextIntlClientProvider } from 'next-intl';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { DateTimeField } from './DateTimeField';

const Field = (props: {
  initial: string;
  locale?: 'en' | 'fr';
  clearable?: boolean;
  dateOnly?: boolean;
  error?: string;
}) => {
  const [value, setValue] = useState(props.initial);

  return (
    <NextIntlClientProvider
      locale={props.locale ?? 'en'}
      messages={props.locale === 'fr' ? fr : en}
      timeZone="UTC"
    >
      <DateTimeField
        id="when"
        label="When"
        value={value}
        onChange={setValue}
        timeZone="America/New_York"
        clearable={props.clearable}
        dateOnly={props.dateOnly}
        error={props.error ? { type: 'server', message: props.error } : undefined}
      />
      <output data-testid="value">{value || 'empty'}</output>
    </NextIntlClientProvider>
  );
};

const dayButton = () => page.getByRole('button', { name: /^When/u });

describe(DateTimeField, () => {
  it('names the calendar in the page language', async () => {
    await render(<Field initial="" locale="fr" />);

    await dayButton().click();

    await expect.element(page.getByRole('button', { name: 'Aller au mois suivant' })).toBeVisible();
  });

  it('starts a picked day at 09:00 when no time was typed', async () => {
    await render(<Field initial="" />);

    await dayButton().click();
    await page.getByRole('button', { name: /15th/u }).click();

    await expect.element(page.getByTestId('value')).toHaveTextContent(/-15T09:00$/u);
    await expect.element(page.getByLabelText('time')).toHaveValue('09:00');
  });

  it('keeps the time typed before a day was picked', async () => {
    await render(<Field initial="" />);

    await page.getByLabelText('time').fill('14:30');
    await dayButton().click();
    await page.getByRole('button', { name: /15th/u }).click();

    await expect.element(page.getByTestId('value')).toHaveTextContent(/-15T14:30$/u);
  });

  it('clears the value and keeps the focus in the field', async () => {
    await render(<Field initial="2026-10-20T09:30" clearable />);

    await page.getByRole('button', { name: 'Clear When' }).click();

    await expect.element(page.getByTestId('value')).toHaveTextContent('empty');
    await expect.element(dayButton()).toHaveFocus();
    expect(page.getByRole('button', { name: 'Clear When' }).elements()).toHaveLength(0);
  });

  it('offers no clear button unless the field may be empty', async () => {
    await render(<Field initial="2026-10-20T09:30" />);

    expect(page.getByRole('button', { name: 'Clear When' }).elements()).toHaveLength(0);
  });

  it('keeps naming the time zone while an error shows', async () => {
    await render(<Field initial="" error="Enter a date and a time" />);

    await expect.element(page.getByText('Enter a date and a time')).toBeVisible();
    await expect.element(page.getByText('Workspace time (America/New York)')).toBeVisible();
  });

  it('holds a day alone, with no time and no zone, when it is date only', async () => {
    await render(<Field initial="" dateOnly clearable />);

    await dayButton().click();
    await page.getByRole('button', { name: /15th/u }).click();

    await expect.element(page.getByTestId('value')).toHaveTextContent(/^\d{4}-\d{2}-15$/u);
    expect(page.getByLabelText('time').elements()).toHaveLength(0);
    expect(page.getByText(/Workspace time/u).elements()).toHaveLength(0);
    await page.getByRole('button', { name: 'Clear When' }).click();
    await expect.element(page.getByTestId('value')).toHaveTextContent('empty');
  });
});

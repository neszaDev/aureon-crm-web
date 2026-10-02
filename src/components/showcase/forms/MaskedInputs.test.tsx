import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import messages from '@/locales/en.json';
import { MaskedInputs } from './MaskedInputs';

const renderInputs = async () =>
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <MaskedInputs />
    </NextIntlClientProvider>,
  );

describe(MaskedInputs, () => {
  it('formats digits into the phone pattern', async () => {
    await renderInputs();

    await page.getByLabelText('Phone number').click();
    await userEvent.keyboard('2125550142');

    await expect.element(page.getByLabelText('Phone number')).toHaveValue('(212) 555-0142');
  });

  it('shows the date guide and refuses a day starting with 4', async () => {
    await renderInputs();
    const date = page.getByLabelText('Date input');

    await expect.element(date).toHaveValue('__/__/____');

    await date.click();
    await userEvent.keyboard('{Home}4');

    await expect.element(date).toHaveValue('__/__/____');

    await userEvent.keyboard('12');

    await expect.element(date).toHaveValue('12/__/____');
  });

  it('drops letters typed into the card number', async () => {
    await renderInputs();

    await page.getByLabelText('Credit card number').click();
    await userEvent.keyboard('4242abc4242');

    await expect
      .element(page.getByLabelText('Credit card number'))
      .toHaveValue('4242 4242 #### ####');
  });
});

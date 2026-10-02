import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { TooltipProvider } from '@/components/ui/tooltip';
import messages from '@/locales/en.json';
import { MultiLanguageFields } from './MultiLanguageFields';

const renderFields = async (editable: boolean) =>
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <TooltipProvider>
        <MultiLanguageFields editable={editable} />
      </TooltipProvider>
    </NextIntlClientProvider>,
  );

describe(MultiLanguageFields, () => {
  describe('Editable', () => {
    it('adds and removes rows and keeps the data preview in sync', async () => {
      await renderFields(true);

      await expect.element(page.getByLabelText('Language key, row 1')).toHaveValue('th');
      await page.getByRole('button', { name: 'Add a language' }).first().click();
      await page.getByLabelText('Language key, row 3').fill('fr');
      await page.getByLabelText('Text, row 3').fill('Bonjour');

      await expect.element(page.getByText('"value": "Bonjour"')).toBeInTheDocument();

      await page.getByRole('button', { name: 'Remove row 1' }).click();

      await expect.element(page.getByLabelText('Language key, row 1')).toHaveValue('en');
      await expect.element(page.getByLabelText('Language key, row 3')).not.toBeInTheDocument();
    });

    it('offers an add button once every row is removed', async () => {
      await renderFields(true);
      await page.getByRole('button', { name: 'Remove row 2' }).click();
      await page.getByRole('button', { name: 'Remove row 1' }).click();

      await page.getByRole('button', { name: 'Add a language' }).click();

      await expect.element(page.getByLabelText('Language key, row 1')).toHaveValue('');
    });
  });

  describe('Read-only rows', () => {
    it('hides the add and remove buttons', async () => {
      await renderFields(false);

      await expect.element(page.getByLabelText('Text, row 2')).toBeVisible();
      await expect
        .element(page.getByRole('button', { name: 'Remove row 1' }))
        .not.toBeInTheDocument();
    });
  });
});

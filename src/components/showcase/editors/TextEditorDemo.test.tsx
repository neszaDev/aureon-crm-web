import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import messages from '@/locales/en.json';
import { TextEditorDemo } from './TextEditorDemo';

const renderDemo = async () =>
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <TextEditorDemo content="<p>Spring term</p>" />
    </NextIntlClientProvider>,
  );

describe(TextEditorDemo, () => {
  it('prints the HTML of the document under the editor', async () => {
    await renderDemo();

    await expect.element(page.getByText('<p>Spring term</p>')).toBeVisible();
  });

  it('writes bold text after the bold toggle and can undo it', async () => {
    await renderDemo();
    const editor = page.getByRole('textbox', { name: 'Document' });

    await editor.click();
    await userEvent.keyboard('{End}');
    await page.getByRole('button', { name: 'Bold' }).click();
    await userEvent.keyboard(' report');

    await expect.element(page.getByText(/<strong>\s?report<\/strong>/u)).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Bold' }))
      .toHaveAttribute('aria-pressed', 'true');

    await page.getByRole('button', { name: 'Undo' }).click();

    await expect.element(page.getByText('<p>Spring term</p>')).toBeVisible();
  });

  it('turns the current paragraph into a heading', async () => {
    await renderDemo();

    await page.getByRole('textbox', { name: 'Document' }).click();
    await page.getByRole('button', { name: 'Heading 2' }).click();

    await expect.element(page.getByText('<h2>Spring term</h2>')).toBeVisible();
  });
});

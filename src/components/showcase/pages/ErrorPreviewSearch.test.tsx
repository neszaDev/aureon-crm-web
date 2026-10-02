import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { ErrorPreviewSearch } from './ErrorPreviewSearch';

describe(ErrorPreviewSearch, () => {
  it('says that the preview searches nothing, quoting the words typed', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <ErrorPreviewSearch />
      </NextIntlClientProvider>,
    );

    await page.getByRole('searchbox', { name: 'Search' }).fill('  spring grades ');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect
      .element(page.getByRole('status'))
      .toHaveTextContent('This is a preview: nothing was searched for “spring grades”.');
  });
});

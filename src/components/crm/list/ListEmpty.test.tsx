import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { ListEmpty } from './ListEmpty';

describe(ListEmpty, () => {
  it('says what an empty archive holds, without a second title, and links back', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <ListEmpty
          variant="archived"
          text="Companies you archive show here, ready to restore."
          activeHref="/app/1/companies?sort=UPDATED_AT"
        />
      </NextIntlClientProvider>,
    );

    await expect
      .element(page.getByText('Companies you archive show here, ready to restore.'))
      .toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Back to the active list' }))
      .toHaveAttribute('href', '/app/1/companies?sort=UPDATED_AT');
    // One paragraph of text: the list's heading already says the archive is empty.
    expect(document.querySelectorAll('p')).toHaveLength(1);
  });
});

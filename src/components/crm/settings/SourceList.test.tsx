import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import { SourceList } from './SourceList';

const done = vi.fn<() => Promise<ActionResult>>().mockResolvedValue({ ok: true });

describe(SourceList, () => {
  it('clears the add form once the source is saved, ready for the next one', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <SourceList
          sources={[]}
          canManage
          headingId="sources-heading"
          actions={{ create: done, update: done, remove: done }}
        />
      </NextIntlClientProvider>,
    );
    await page.getByLabelText('Source name').fill('Trade fair');

    await page.getByRole('button', { name: 'Add source' }).click();

    expect(done).toHaveBeenCalledWith({ name: 'Trade fair' });
    await expect.element(page.getByLabelText('Source name')).toHaveValue('');
  });
});

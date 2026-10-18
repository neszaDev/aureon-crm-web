import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import { SourceList } from './SourceList';

const done = vi.fn<() => Promise<ActionResult>>().mockResolvedValue({ ok: true });

describe(SourceList, () => {
  it('clears the add form each time a source is saved, ready for the next one', async () => {
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
    const name = page.getByLabelText('Source name');

    await name.fill('Trade fair');
    await page.getByRole('button', { name: 'Add source' }).click();

    await expect.element(name).toHaveValue('');
    expect(done).toHaveBeenLastCalledWith({ name: 'Trade fair' });

    await name.fill('Referral');
    await page.getByRole('button', { name: 'Add source' }).click();

    await expect.element(name).toHaveValue('');
    expect(done).toHaveBeenLastCalledWith({ name: 'Referral' });
  });
});

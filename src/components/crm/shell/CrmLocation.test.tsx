import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import * as Navigation from '@/libs/I18nNavigation';
import messages from '@/locales/en.json';
import { CrmLocation } from './CrmLocation';

vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  usePathname: vi.fn<typeof Navigation.usePathname>(),
}));

const trailAt = async (path: string) => {
  vi.mocked(Navigation.usePathname).mockReturnValue(path);
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <CrmLocation workspace={{ id: 7, name: 'Northwind Supply' }} />
    </NextIntlClientProvider>,
  );

  return page.getByRole('navigation', { name: 'Location' });
};

const steps = (trail: ReturnType<typeof page.getByRole>) =>
  trail
    .getByRole('listitem')
    .elements()
    .map((item) => {
      const link = item.querySelector('a');
      const label = item.textContent ?? '';
      return link ? `${label} → ${link.getAttribute('href')}` : `${label} (current)`;
    });

describe(CrmLocation, () => {
  it('names the workspace alone on its home', async () => {
    const trail = await trailAt('/app/7');

    expect(steps(trail)).toStrictEqual(['Northwind Supply (current)']);
    await expect
      .element(trail.getByText('Northwind Supply'))
      .toHaveAttribute('aria-current', 'page');
  });

  it('names a record by its number under its section, which links back up', async () => {
    expect(steps(await trailAt('/app/7/deals/42'))).toStrictEqual([
      'Northwind Supply → /app/7',
      'Deals → /app/7/deals',
      'D-0042 (current)',
    ]);
  });

  it('links the record from its edit page, which has no step of its own', async () => {
    expect(steps(await trailAt('/app/7/companies/3/edit'))).toStrictEqual([
      'Northwind Supply → /app/7',
      'Companies → /app/7/companies',
      'C-0003 → /app/7/companies/3',
    ]);
  });

  it('names a new record', async () => {
    expect(steps(await trailAt('/app/7/leads/new'))).toStrictEqual([
      'Northwind Supply → /app/7',
      'Leads → /app/7/leads',
      'New (current)',
    ]);
  });

  it('names a settings page under Settings, which opens the first one', async () => {
    expect(steps(await trailAt('/app/7/settings/sources'))).toStrictEqual([
      'Northwind Supply → /app/7',
      'Settings → /app/7/settings/workspace',
      'Lead sources (current)',
    ]);
  });

  it('stops at the workspace for a path it does not know', async () => {
    expect(steps(await trailAt('/app/7/nowhere'))).toStrictEqual(['Northwind Supply → /app/7']);
  });
});

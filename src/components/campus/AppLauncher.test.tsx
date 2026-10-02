import { GaugeIcon, TicketIcon } from 'lucide-react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { AppLauncher } from './AppLauncher';

describe(AppLauncher, () => {
  it('shows each category with its app count and caps badges at 99+', async () => {
    await render(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <AppLauncher
          categories={[
            {
              id: 'c1',
              name: 'events',
              icon: TicketIcon,
              apps: [
                { id: 'a1', name: 'application', badge: 0, icon: GaugeIcon },
                { id: 'a2', name: 'application', badge: 120, icon: GaugeIcon },
              ],
            },
          ]}
        />
      </NextIntlClientProvider>,
    );

    const events = page.getByRole('region', { name: 'Events' });

    await expect.element(events.getByText('2 apps')).toBeVisible();
    await expect.element(events.getByText('99+')).toBeVisible();
    await expect.element(events.getByText('120 new notifications')).toBeInTheDocument();
    await expect
      .element(events.getByText('0 new notifications', { exact: true }))
      .not.toBeInTheDocument();
  });
});

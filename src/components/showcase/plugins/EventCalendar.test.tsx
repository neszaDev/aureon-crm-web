import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import messages from '@/locales/en.json';
// Drag and drop measures the layout, so the real styles are needed.
import '@/styles/global.css';
import { EventCalendar } from './EventCalendar';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

describe(EventCalendar, () => {
  it('opens on the month of today with the sample events', async () => {
    await render(withIntl(<EventCalendar today="2026-10-02" />));

    await expect.element(page.getByRole('heading', { name: 'October 2026' })).toBeVisible();
    await expect.element(page.getByRole('button', { name: /^Conference, /u })).toBeVisible();
  });

  it('shows the details of a clicked event', async () => {
    await render(withIntl(<EventCalendar today="2026-10-02" />));

    await page.getByRole('button', { name: /^Conference, /u }).click();

    await expect.element(page.getByText('Big conference for important people')).toBeVisible();
    await expect
      .element(page.getByText(/^You clicked/u))
      .toHaveTextContent('You clicked Conference.');
  });

  it('says which day was clicked', async () => {
    await render(withIntl(<EventCalendar today="2026-10-02" />));

    await page.getByRole('button', { name: /^Thursday, October 15th, 2026/u }).click();

    await expect
      .element(page.getByText(/^You clicked/u))
      .toHaveTextContent('You clicked October 15th, 2026.');
  });

  it('moves between months and switches to the week view', async () => {
    await render(withIntl(<EventCalendar today="2026-10-02" />));

    await page.getByRole('button', { name: 'Next month' }).click();
    await expect.element(page.getByRole('heading', { name: 'November 2026' })).toBeVisible();

    await page.getByRole('button', { name: 'Today' }).click();
    await page.getByRole('combobox', { name: 'View' }).selectOptions('week');

    await expect.element(page.getByTestId('week-2026-09-27')).toBeVisible();
    await expect.element(page.getByTestId('week-2026-10-04')).not.toBeInTheDocument();
  });

  it('moves an event to the next day with the keyboard', async () => {
    await render(withIntl(<EventCalendar today="2026-10-02" />));

    page
      .getByRole('button', { name: /^Some event, /u })
      .element()
      .focus();
    await userEvent.keyboard('[Space]');
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('[Space]');

    await expect
      .element(page.getByText('Moved Some event to October 10th, 2026.', { exact: true }))
      .toBeVisible();
  });
});

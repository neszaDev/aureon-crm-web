import { NextIntlClientProvider } from 'next-intl';
import { beforeEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import messages from '@/locales/en.json';
// Drag and drop measures the layout, so the real styles are needed.
import '@/styles/global.css';
import { DraggableGrid } from './DraggableGrid';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

const order = () =>
  page
    .getByTestId(/^grid-card-/u)
    .elements()
    .map((node) => node.dataset.testid?.replace('grid-card-', ''));

describe(DraggableGrid, () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('moves a card past the pinned one with the keyboard', async () => {
    await render(withIntl(<DraggableGrid />));

    page.getByRole('button', { name: 'Move Drag and drop card 1' }).element().focus();
    await userEvent.keyboard('[Space]');
    // The test viewport is phone-sized: the grid is one column.
    await userEvent.keyboard('{ArrowDown}');
    await expect.element(page.getByText(/is over Drag and drop card 3/u)).toBeInTheDocument();
    await userEvent.keyboard('[Space]');

    await expect.poll(order).toStrictEqual(['3', '2', '1', '4', '5', '6']);
  });

  it('saves the layout and offers to restore it', async () => {
    await render(withIntl(<DraggableGrid />));

    await expect
      .element(page.getByRole('button', { name: 'Restore the saved layout' }))
      .not.toBeInTheDocument();
    await page.getByRole('button', { name: 'Show Drag and drop card 3 taller' }).click();
    await page.getByRole('button', { name: 'Save the layout' }).click();

    await expect.element(page.getByText('Layout saved in this browser.')).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Restore the saved layout' }))
      .toBeVisible();
    expect(window.localStorage.getItem('marksheet-draggable-layout')).toContain('"tall":true');
  });

  it('hides the handles and size buttons when the options are off', async () => {
    await render(withIntl(<DraggableGrid />));

    await page.getByRole('switch', { name: 'Drag and drop' }).click();
    await page.getByRole('switch', { name: 'Resizing' }).click();

    await expect
      .element(page.getByRole('button', { name: /^Move /u }).first())
      .not.toBeInTheDocument();
    await expect
      .element(page.getByRole('button', { name: /taller$/u }).first())
      .not.toBeInTheDocument();
  });
});

import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import { Meter } from './Meter';

const withIntl = (ui: React.ReactNode) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    {ui}
  </NextIntlClientProvider>
);

const VALUE = 33.333333333;

describe(Meter, () => {
  describe('Labels', () => {
    it('prints the value and the percentage of max, rounded to the precision', async () => {
      await render(
        withIntl(
          <>
            <Meter label="value" max={50} segments={[{ value: VALUE, label: 'value' }]} />
            <Meter label="percent" max={50} segments={[{ value: VALUE, label: 'percentage' }]} />
            <Meter
              label="value2"
              max={50}
              precision={2}
              segments={[{ value: VALUE, label: 'value' }]}
            />
            <Meter
              label="percent2"
              max={50}
              precision={2}
              segments={[{ value: VALUE, label: 'percentage' }]}
            />
          </>,
        ),
      );

      await expect
        .element(page.getByRole('progressbar', { name: 'value', exact: true }))
        .toHaveTextContent('33');
      await expect
        .element(page.getByRole('progressbar', { name: 'percent', exact: true }))
        .toHaveTextContent('67%');
      await expect
        .element(page.getByRole('progressbar', { name: 'value2' }))
        .toHaveTextContent('33.33');
      await expect
        .element(page.getByRole('progressbar', { name: 'percent2' }))
        .toHaveTextContent('66.67%');
    });
  });

  describe('Stacked', () => {
    it('groups one progress bar per segment, each sized to its share', async () => {
      await render(
        withIntl(
          <Meter
            label="Stacked"
            segments={[
              { value: 15, tone: 'folder' },
              { value: 30, tone: 'pass' },
            ]}
          />,
        ),
      );

      const bars = page.getByRole('group', { name: 'Stacked' }).getByRole('progressbar');

      expect(bars.elements()).toHaveLength(2);
      await expect.element(bars.nth(1)).toHaveAttribute('aria-valuenow', '30');
      await expect.element(bars.nth(1)).toHaveStyle({ width: '30%' });
    });
  });
});

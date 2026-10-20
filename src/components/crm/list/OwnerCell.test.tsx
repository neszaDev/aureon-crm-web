import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { Table, TableBody, TableRow } from '@/components/ui/table';
// The one line of the name is a style.
import '@/styles/global.css';
import messages from '@/locales/en.json';
import { OwnerCell } from './OwnerCell';

const OWNER = { userId: 1, email: 'olivia@acme.test', displayName: 'Olivia Owner' };

const renderCell = async (owner: Parameters<typeof OwnerCell>[0]['owner'], width: number) =>
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <div style={{ width }}>
        <Table>
          <TableBody>
            <TableRow>
              <OwnerCell owner={owner} />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </NextIntlClientProvider>,
  );

/**
 * How many lines a text is set on.
 * @param element The element holding the text.
 * @returns The count of distinct line tops.
 */
const lines = (element: Element) => {
  const range = document.createRange();
  range.selectNodeContents(element);

  return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
};

describe(OwnerCell, () => {
  it('keeps the name on one line from 640 px, even in a narrow cell', async () => {
    await page.viewport(1024, 768);
    await renderCell(OWNER, 60);

    const name = page.getByText('Olivia Owner').element();

    expect(getComputedStyle(name).whiteSpace).toBe('nowrap');
    expect(lines(name)).toBe(1);
  });

  it('gives the full name as the title of one cut short from 640 px', async () => {
    await page.viewport(1024, 768);
    const long = { ...OWNER, displayName: 'Olivia Owner-Of-A-Very-Long-Double-Barrelled-Name' };
    await renderCell(long, 600);

    const name = page.getByText(long.displayName).element();

    expect(name).toHaveAttribute('title', long.displayName);
    expect(name.getBoundingClientRect().width).toBeLessThanOrEqual(160);
  });

  it('wraps a long name on a phone, where a cut tail could not be read by hovering', async () => {
    await page.viewport(390, 844);
    const long = { ...OWNER, displayName: 'Olivia Owner-Of-A-Very-Long Double-Barrelled Name' };
    await renderCell(long, 600);

    const name = page.getByText(long.displayName).element();

    expect(getComputedStyle(name).textOverflow).not.toBe('ellipsis');
    expect(lines(name)).toBeGreaterThan(1);
    expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
  });
});

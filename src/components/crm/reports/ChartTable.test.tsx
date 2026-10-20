import { NextIntlClientProvider } from 'next-intl';
import { afterEach, describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { ChartTable } from './ChartTable';

const table = async (locale: 'en' | 'fr' = 'en') =>
  await render(
    <NextIntlClientProvider locale={locale} messages={locale === 'fr' ? fr : en} timeZone="UTC">
      <ChartTable>
        <table aria-label="Deals by stage">
          <tbody>
            <tr>
              <th scope="row">Qualification</th>
              <td>4</td>
            </tr>
          </tbody>
        </table>
      </ChartTable>
    </NextIntlClientProvider>,
  );

// The test browser is a phone (414 px) unless a test says otherwise.
const PHONE = { width: 414, height: 896 };

// Closed, the table is out of the accessibility tree: it is looked for as it is in the page.
const stageTable = () => page.getByRole('table', { name: 'Deals by stage', includeHidden: true });

describe(ChartTable, () => {
  afterEach(async () => {
    await page.viewport(PHONE.width, PHONE.height);
  });

  it('is open at every width', async () => {
    await table();
    await expect.element(stageTable()).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Table', exact: true }))
      .toHaveAttribute('aria-expanded', 'true');
    await page.viewport(1024, 768);
    await expect.element(stageTable()).toBeVisible();
    await page.viewport(1440, 900);
    await expect.element(stageTable()).toBeVisible();
  });

  it('is open at once on a wide screen, with no click', async () => {
    await page.viewport(1024, 768);
    await table();

    await expect.element(stageTable()).toBeVisible();
    await expect
      .element(page.getByRole('button', { name: 'Table', exact: true }))
      .toHaveAttribute('aria-expanded', 'true');
    // Nothing in it is hidden by a class that waits for the screen's width.
    expect(stageTable().element().closest('[hidden]')).toBeNull();
    expect(stageTable().element().parentElement?.className ?? '').not.toContain('hidden');
  });

  it('is hidden by the button and shown again by it, the button keeping its name', async () => {
    await table();
    const button = page.getByRole('button', { name: 'Table', exact: true });

    await button.click();

    await expect.element(button).toHaveAttribute('aria-expanded', 'false');
    await expect.element(stageTable()).not.toBeVisible();
    await button.click();
    await expect.element(button).toHaveAttribute('aria-expanded', 'true');
    await expect.element(stageTable()).toBeVisible();
  });

  it('keeps what the reader chose when the window is resized', async () => {
    await table();
    await page.getByRole('button', { name: 'Table', exact: true }).click();

    await page.viewport(1024, 768);

    await expect
      .element(page.getByRole('button', { name: 'Table', exact: true }))
      .toHaveAttribute('aria-expanded', 'false');
    await expect.element(stageTable()).not.toBeVisible();
  });

  it('labels the button in the page language', async () => {
    await table('fr');

    await expect.element(page.getByRole('button', { name: 'Tableau', exact: true })).toBeVisible();
  });
});

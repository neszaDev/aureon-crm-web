import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import messages from '@/locales/en.json';
import type { DataColumn } from './DataTable';
import { DataTable } from './DataTable';

type Pupil = { id: number; name: string; house: string };

const pupils: Pupil[] = [
  { id: 1, name: 'Cleo', house: 'Oak' },
  { id: 2, name: 'Ada', house: 'Elm' },
  { id: 3, name: 'Ben', house: 'Oak' },
];
const columns: DataColumn<Pupil>[] = [
  { id: 'name', header: 'Name', value: (pupil) => pupil.name },
  { id: 'house', header: 'House', value: (pupil) => pupil.house },
];
const many = Array.from({ length: 12 }, (_, index) => ({
  id: index + 1,
  name: `Pupil ${String(index + 1).padStart(2, '0')}`,
  house: 'Ash',
}));

const renderTable = async (props: Partial<React.ComponentProps<typeof DataTable<Pupil>>> = {}) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <DataTable
        data={pupils}
        columns={columns}
        getRowId={(pupil) => String(pupil.id)}
        caption="Pupils"
        {...props}
      />
    </NextIntlClientProvider>,
  );
};

// Row 0 is the head row.
const firstRow = () => page.getByRole('row').nth(1);

describe(DataTable, () => {
  describe('Sorting', () => {
    it('sorts ascending, then descending, on clicks on a head', async () => {
      await renderTable({ sorter: true });
      const head = page.getByRole('button', { name: 'Name' });

      await head.click();

      await expect.element(firstRow()).toHaveTextContent('Ada');
      expect(document.querySelector('th[aria-sort]')?.getAttribute('aria-sort')).toBe('ascending');

      await head.click();

      await expect.element(firstRow()).toHaveTextContent('Cleo');
    });
  });

  describe('Filters', () => {
    it('narrows the rows with the table filter and says when nothing matches', async () => {
      await renderTable({ tableFilter: true });
      const filter = page.getByRole('searchbox', { name: 'Filter' });

      await filter.fill('oak');

      await expect.element(page.getByRole('cell', { name: 'Cleo' })).toBeVisible();
      await expect.element(page.getByRole('cell', { name: 'Ada' })).not.toBeInTheDocument();

      await filter.fill('pine');

      await expect.element(page.getByText('No rows match the filters')).toBeVisible();
    });

    it('filters one column with its own field', async () => {
      await renderTable({ columnFilter: true });

      await page.getByRole('searchbox', { name: 'Filter by House' }).fill('elm');

      await expect.element(page.getByRole('cell', { name: 'Ada' })).toBeVisible();
      await expect.element(page.getByRole('cell', { name: 'Ben' })).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('shows one page of rows and moves to the next page', async () => {
      await renderTable({ data: many, itemsPerPage: 5, pagination: true });

      await expect.element(page.getByRole('cell', { name: 'Pupil 05' })).toBeVisible();
      await expect.element(page.getByRole('cell', { name: 'Pupil 06' })).not.toBeInTheDocument();

      await page.getByRole('button', { name: 'Next page' }).click();

      await expect.element(firstRow()).toHaveTextContent('Pupil 06');
      await expect
        .element(page.getByRole('button', { name: 'Page 2' }))
        .toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Rows', () => {
    it('opens and closes the details of a row', async () => {
      await renderTable({ renderDetails: (pupil) => <p>House of {pupil.name}</p> });

      await page.getByRole('button', { name: 'Show details of Ada' }).click();

      await expect.element(page.getByText('House of Ada')).toBeVisible();

      await page.getByRole('button', { name: 'Hide details of Ada' }).click();

      await expect.element(page.getByText('House of Ada')).not.toBeInTheDocument();
    });

    it('selects rows by click and all filtered rows with the head box', async () => {
      await renderTable({ selectable: true, selectOnRowClick: true });

      await page.getByRole('cell', { name: 'Ben', exact: true }).click();

      await expect.element(page.getByRole('checkbox', { name: 'Select Ben' })).toBeChecked();
      await expect.element(page.getByText('1 row selected')).toBeVisible();

      await page.getByRole('checkbox', { name: 'Select all rows' }).click();

      await expect.element(page.getByText('3 rows selected')).toBeVisible();
    });

    it('shows the loading overlay while rows load', async () => {
      await renderTable({ data: [], loading: true });

      await expect.element(page.getByRole('status', { name: 'Loading' })).toBeVisible();
    });
  });
});

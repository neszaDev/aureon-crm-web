'use client';

import { DownloadIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { USERS } from '@/components/showcase/users/data';
import { useUserColumns } from '@/components/showcase/users/useUserColumns';
import { Button } from '@/components/ui/button';
import { downloadCsv, toCsv } from './csv';
import { DataTable } from './DataTable';

/**
 * The Vue `DownloadTable`: a filterable, sortable table whose current rows (every page, after
 * filters and sorting) download as CSV.
 * @returns The table with its download button.
 */
export const DownloadTable = () => {
  const t = useTranslations('AdvancedTablesPage');
  const columns = useUserColumns();

  return (
    <DataTable
      data={USERS}
      columns={columns}
      getRowId={(user) => String(user.id)}
      caption={t('download_title')}
      itemsPerPage={5}
      columnFilter
      sorter
      pagination
      toolbar={(rows) => (
        <div>
          <Button
            type="button"
            disabled={rows.length === 0}
            onClick={() => {
              downloadCsv({
                filename: 'table-data.csv',
                csv: toCsv([
                  columns.map((column) => column.header),
                  ...rows.map((row) => columns.map((column) => column.value(row))),
                ]),
              });
            }}
          >
            <DownloadIcon data-icon="inline-start" />
            {t('download_button', { count: rows.length })}
          </Button>
        </div>
      )}
    />
  );
};

'use client';

import { useTranslations } from 'next-intl';
import { USERS } from '@/components/showcase/users/data';
import { useUserColumns, VUE_COLUMN_WIDTHS } from '@/components/showcase/users/useUserColumns';
import { DataTable } from './DataTable';

/**
 * The Vue `SelectTable`: a checkbox per row (a click anywhere on the row toggles it), plus a
 * select-all box for the filtered rows and the selected count.
 * @returns The table.
 */
export const SelectTable = () => {
  const t = useTranslations('AdvancedTablesPage');
  const columns = useUserColumns({ widths: VUE_COLUMN_WIDTHS });

  return (
    <DataTable
      data={USERS}
      columns={columns}
      getRowId={(user) => String(user.id)}
      caption={t('select_title')}
      itemsPerPage={5}
      tableFilter
      columnFilter
      itemsPerPageSelect
      sorter
      pagination
      selectable
      selectOnRowClick
    />
  );
};

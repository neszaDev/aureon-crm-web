'use client';

import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { USERS } from '@/components/showcase/users/data';
import { useUserColumns } from '@/components/showcase/users/useUserColumns';
import type { TableQuery } from './DataTable';
import { DataTable, initialQuery } from './DataTable';
import { queryRows } from './fakeBackend';

const PAGE_SIZE = 5;
// The Vue example's fake round trip.
const LATENCY_MS = 1000;

/**
 * The Vue `BackendTable`: filters, sorting and paging are sent to a "backend" that answers a
 * second later; the table shows a loading overlay meanwhile. Filters apply on change (blur or
 * Enter), and a third click on a sorted head removes the sort.
 * @returns The table.
 */
export const BackendTable = () => {
  const t = useTranslations('AdvancedTablesPage');
  const columns = useUserColumns();
  const [query, setQuery] = useState(() => initialQuery(PAGE_SIZE));
  const [page, setPage] = useState(() => queryRows({ rows: USERS, columns, query }));
  const [loading, setLoading] = useState(false);
  const request = useRef(0);

  const load = (next: TableQuery) => {
    setQuery(next);
    setLoading(true);
    request.current += 1;
    const sent = request.current;
    setTimeout(() => {
      // Only the latest request may answer; older ones were superseded.
      if (sent === request.current) {
        setPage(queryRows({ rows: USERS, columns, query: next }));
        setLoading(false);
      }
    }, LATENCY_MS);
  };

  return (
    <DataTable
      data={page.rows}
      rowCount={page.total}
      columns={columns}
      getRowId={(user) => String(user.id)}
      caption={t('backend_title')}
      query={query}
      onQueryChange={load}
      loading={loading}
      tableFilter
      columnFilter
      lazyFilters
      sorter
      sorterResettable
      pagination
    />
  );
};

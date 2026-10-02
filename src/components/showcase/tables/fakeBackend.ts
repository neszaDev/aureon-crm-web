import type { DataColumn, TableQuery } from './DataTable';

const compare = (a: string | number, b: string | number) =>
  typeof a === 'number' && typeof b === 'number'
    ? a - b
    : String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });

const includes = (value: string | number, search: string) =>
  String(value).toLowerCase().includes(search.toLowerCase());

/**
 * A stand-in for a backend list endpoint: filters, sorts and pages `rows` the way a server
 * would answer the table's query (case-insensitive "contains" filters, one sort column).
 * @param options Query options.
 * @param options.rows Every row the "server" holds.
 * @param options.columns Columns whose values the query filters and sorts.
 * @param options.query The table query.
 * @returns The requested page and the number of matching rows.
 */
export const queryRows = <TData>(options: {
  rows: TData[];
  columns: DataColumn<TData>[];
  query: TableQuery;
}) => {
  const { query } = options;
  const searchable = options.columns.filter((column) => column.filterable !== false);
  const matching = options.rows.filter(
    (row) =>
      (query.globalFilter === '' ||
        searchable.some((column) => includes(column.value(row), query.globalFilter))) &&
      query.columnFilters.every((filter) => {
        const column = searchable.find((candidate) => candidate.id === filter.id);
        return !column || includes(column.value(row), String(filter.value));
      }),
  );

  const [sort] = query.sorting;
  const sortColumn = sort && options.columns.find((column) => column.id === sort.id);
  const sorted = sortColumn
    ? matching.toSorted((a, b) => {
        const order = compare(sortColumn.value(a), sortColumn.value(b));
        return sort.desc ? -order : order;
      })
    : matching;

  const start = query.pageIndex * query.pageSize;
  return { rows: sorted.slice(start, start + query.pageSize), total: matching.length };
};

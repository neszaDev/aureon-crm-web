'use client';

import type { ColumnDef, ColumnFiltersState, RowData, SortingState } from '@tanstack/react-table';
import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { cn } from 'cn';
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, SearchXIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TablePagination } from './TablePagination';

// TanStack Table runs the row pipeline (filter → sort → paginate); the markup is ours.
const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  filteredRowModel: createFilteredRowModel(),
  filterFns: { includesString: filterFn_includesString },
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
});

const PAGE_SIZES = [5, 10, 20, 50];

/** A column of a {@link DataTable}. */
export type DataColumn<TData> = {
  id: string;
  /** Column head (also names the column's filter field). */
  header: string;
  /** The value the table sorts, filters and exports. */
  value: (row: TData) => string | number;
  /** Custom cell; defaults to the value. */
  cell?: (row: TData) => React.ReactNode;
  /** Defaults to true when the table has a sorter. */
  sortable?: boolean;
  /** Defaults to true: the column takes part in the table and column filters. */
  filterable?: boolean;
  /** Classes for the column's head and cells (e.g. a width). */
  className?: string;
};

/** Everything that decides which rows a table shows: what a backend would receive. */
export type TableQuery = {
  sorting: SortingState;
  columnFilters: ColumnFiltersState;
  globalFilter: string;
  pageIndex: number;
  pageSize: number;
};

/**
 * The query of a table before anyone touches it.
 * @param pageSize Rows per page.
 * @returns A query with no sorting or filters, on the first page.
 */
export const initialQuery = (pageSize: number): TableQuery => ({
  sorting: [],
  columnFilters: [],
  globalFilter: '',
  pageIndex: 0,
  pageSize,
});

/**
 * The next sorting after a click on a column head: ascending, then descending, then (when the
 * sorter is resettable) unsorted.
 * @param options Sort options.
 * @param options.sorting Current sorting.
 * @param options.columnId The clicked column.
 * @param options.resettable Whether a third click removes the sort.
 * @returns The new sorting.
 */
const nextSorting = (options: {
  sorting: SortingState;
  columnId: string;
  resettable: boolean;
}): SortingState => {
  const [current] = options.sorting;
  if (current?.id !== options.columnId) {
    return [{ id: options.columnId, desc: false }];
  }
  if (!current.desc) {
    return [{ id: options.columnId, desc: true }];
  }
  return options.resettable ? [] : [{ id: options.columnId, desc: false }];
};

const isFromControl = (target: EventTarget) =>
  target instanceof Element && target.closest('button, a, input, label, select, textarea') !== null;

/**
 * Props for a filter input: applied on every keystroke, or (lazy) on change, i.e. blur or Enter.
 * @param options Field options.
 * @param options.value Current filter value.
 * @param options.lazy Apply on change instead of on input.
 * @param options.apply Called with the new value.
 * @returns Input props.
 */
const filterField = (options: { value: string; lazy?: boolean; apply: (next: string) => void }) =>
  options.lazy
    ? {
        defaultValue: options.value,
        onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
          if (event.currentTarget.value !== options.value) {
            options.apply(event.currentTarget.value);
          }
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter') {
            options.apply(event.currentTarget.value);
          }
        },
      }
    : {
        value: options.value,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          options.apply(event.target.value);
        },
      };

type TableStyle = {
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  small?: boolean;
  fixed?: boolean;
  dark?: boolean;
};

/**
 * The Marksheet version of CoreUI's table modifiers. Dark prints the table on a folder-green
 * field; marks keep their shapes in folder ink.
 * @param style Table modifiers.
 * @returns Classes for the table.
 */
const styleClasses = (style: TableStyle) =>
  cn(
    style.fixed && 'table-fixed',
    style.small && '[&_td]:py-1.5 [&_th]:h-8',
    style.hover === false && '[&_tbody_tr]:hover:bg-transparent',
    style.striped && !style.dark && '[&_tbody>tr:nth-child(odd)]:bg-ink-100/45',
    style.bordered &&
      !style.dark &&
      'border border-ink-200 [&_td,&_th]:border [&_td,&_th]:border-ink-200',
    style.dark &&
      'bg-folder text-folder-ink [&_[data-slot=user-status]]:text-folder-ink [&_svg]:text-folder-ink [&_tbody_tr]:hover:bg-white/8 [&_th]:text-folder-ink-soft [&_tr]:border-white/15!',
    style.dark && style.striped && '[&_tbody>tr:nth-child(odd)]:bg-white/6',
    style.dark &&
      style.bordered &&
      'border border-white/15 [&_td,&_th]:border [&_td,&_th]:border-white/15',
  );

/**
 * What the empty table says: loading, nothing matches the filters, or no rows at all.
 * @param options Table state.
 * @param options.loading Whether rows are loading.
 * @param options.query Current query.
 * @returns The message key.
 */
const emptyMessageKey = (options: { loading?: boolean; query: TableQuery }) => {
  if (options.loading) {
    return 'loading';
  }
  const filtered = options.query.globalFilter !== '' || options.query.columnFilters.length > 0;
  return filtered ? 'no_results' : 'no_items';
};

const SORT_ICONS = { none: ArrowUpDownIcon, ascending: ArrowUpIcon, descending: ArrowDownIcon };

/**
 * The column heads, sortable by click, with the select-all box and the details column.
 * @param props Component props.
 * @param props.columns Columns.
 * @param props.sorting Current sorting.
 * @param props.sorter Whether heads sort.
 * @param props.onSort Called with a clicked column's id.
 * @param props.selectAll The select-all box, for selectable tables.
 * @param props.selectAll.checked Its state.
 * @param props.selectAll.onToggle Called when it is clicked.
 * @param props.details Whether there is a details column.
 * @returns The head row.
 */
const HeadRow = <TData,>(props: {
  columns: DataColumn<TData>[];
  sorting: SortingState;
  sorter?: boolean;
  onSort: (columnId: string) => void;
  selectAll?: { checked: boolean | 'indeterminate'; onToggle: () => void };
  details: boolean;
}) => {
  const t = useTranslations('DataTable');
  const [sort] = props.sorting;

  return (
    <TableRow>
      {props.selectAll && (
        <TableHead className="w-10">
          <Checkbox
            aria-label={t('select_all')}
            checked={props.selectAll.checked}
            onCheckedChange={() => props.selectAll?.onToggle()}
          />
        </TableHead>
      )}
      {props.columns.map((column) => {
        if (props.sorter !== true || column.sortable === false) {
          return (
            <TableHead key={column.id} className={column.className}>
              {column.header}
            </TableHead>
          );
        }
        let direction: keyof typeof SORT_ICONS = 'none';
        if (sort?.id === column.id) {
          direction = sort.desc ? 'descending' : 'ascending';
        }
        const SortIcon = SORT_ICONS[direction];

        return (
          <TableHead key={column.id} aria-sort={direction} className={column.className}>
            <button
              type="button"
              className="-mx-1 inline-flex items-center gap-1.5 rounded-sm px-1 uppercase hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => {
                props.onSort(column.id);
              }}
            >
              {column.header}
              <SortIcon
                aria-hidden="true"
                className={cn('size-3.5', direction === 'none' && 'opacity-40')}
              />
            </button>
          </TableHead>
        );
      })}
      {props.details && (
        <TableHead className="w-px">
          <span className="sr-only">{t('details_column')}</span>
        </TableHead>
      )}
    </TableRow>
  );
};

/**
 * The row of column filter fields under the heads.
 * @param props Component props.
 * @param props.columns Columns.
 * @param props.filters Current column filters.
 * @param props.lazy Apply on change instead of on input.
 * @param props.onFilter Called with a column id and its new filter.
 * @param props.selectable Leave room for the checkbox column.
 * @param props.details Leave room for the details column.
 * @returns The filter row.
 */
const FilterRow = <TData,>(props: {
  columns: DataColumn<TData>[];
  filters: ColumnFiltersState;
  lazy?: boolean;
  onFilter: (columnId: string, value: string) => void;
  selectable?: boolean;
  details: boolean;
}) => {
  const t = useTranslations('DataTable');
  const valueOf = (columnId: string) => {
    const value = props.filters.find((filter) => filter.id === columnId)?.value;
    return typeof value === 'string' ? value : '';
  };

  return (
    <TableRow>
      {props.selectable && <TableHead />}
      {props.columns.map((column) => (
        <TableHead key={column.id} className="h-auto pb-2.5 font-normal">
          {column.filterable !== false && (
            <Input
              type="search"
              autoComplete="off"
              aria-label={t('column_filter_label', { column: column.header })}
              className="h-8 min-w-24 sm:text-sm"
              {...filterField({
                value: valueOf(column.id),
                lazy: props.lazy,
                apply: (value) => {
                  props.onFilter(column.id, value);
                },
              })}
            />
          )}
        </TableHead>
      ))}
      {props.details && <TableHead />}
    </TableRow>
  );
};

/**
 * One data row, plus its details row when open.
 * @param props Component props.
 * @param props.item The row's data.
 * @param props.label The row's name, for accessible labels.
 * @param props.columns Columns.
 * @param props.columnCount Columns the details span.
 * @param props.detailsId Id of the details cell.
 * @param props.selected Whether the row is selected; `undefined` when rows are not selectable.
 * @param props.onSelect Called with the new selected state.
 * @param props.open Whether the details are open.
 * @param props.onToggleDetails Called to open or close the details.
 * @param props.renderDetails Renders the details panel.
 * @param props.onClick Called on a click on the row outside its controls.
 * @param props.className Extra row classes.
 * @returns The row, and its details row when open.
 */
const DataRow = <TData,>(props: {
  item: TData;
  label: string;
  columns: DataColumn<TData>[];
  columnCount: number;
  detailsId: string;
  selected?: boolean;
  onSelect: (selected: boolean) => void;
  open: boolean;
  onToggleDetails: () => void;
  renderDetails?: (row: TData) => React.ReactNode;
  onClick?: () => void;
  className?: string;
}) => {
  const t = useTranslations('DataTable');

  return (
    <>
      <TableRow
        data-state={props.selected ? 'selected' : undefined}
        className={cn(props.onClick && 'cursor-pointer', props.className)}
        onClick={(event) => {
          if (!isFromControl(event.target)) {
            props.onClick?.();
          }
        }}
      >
        {props.selected !== undefined && (
          <TableCell>
            <Checkbox
              checked={props.selected}
              aria-label={t('select_row', { row: props.label })}
              onCheckedChange={(checked) => {
                props.onSelect(checked === true);
              }}
            />
          </TableCell>
        )}
        {props.columns.map((column) => (
          <TableCell key={column.id} className={column.className}>
            {column.cell ? column.cell(props.item) : column.value(props.item)}
          </TableCell>
        ))}
        {props.renderDetails && (
          <TableCell className="py-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              aria-expanded={props.open}
              aria-controls={props.open ? props.detailsId : undefined}
              aria-label={
                props.open
                  ? t('hide_details_of', { row: props.label })
                  : t('show_details_of', { row: props.label })
              }
              onClick={() => {
                props.onToggleDetails();
              }}
            >
              {props.open ? t('hide_details') : t('show_details')}
            </Button>
          </TableCell>
        )}
      </TableRow>
      {props.renderDetails && props.open && (
        <TableRow className="hover:bg-transparent">
          <TableCell
            id={props.detailsId}
            colSpan={props.columnCount}
            className="animate-in whitespace-normal duration-200 fade-in"
          >
            {props.renderDetails(props.item)}
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

/**
 * The search field over every column and the rows-per-page select.
 * @param props Component props.
 * @param props.query Current query.
 * @param props.tableFilter Show the search field.
 * @param props.itemsPerPageSelect Show the rows-per-page select.
 * @param props.lazy Apply the search on change instead of on input.
 * @param props.onChange Called with the new query.
 * @returns The controls, or nothing.
 */
const TableControls = (props: {
  query: TableQuery;
  tableFilter?: boolean;
  itemsPerPageSelect?: boolean;
  lazy?: boolean;
  onChange: (query: TableQuery) => void;
}) => {
  const t = useTranslations('DataTable');
  const id = useId();

  if (!props.tableFilter && !props.itemsPerPageSelect) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {props.tableFilter ? (
        <div className="flex items-center gap-2">
          <Label htmlFor={`${id}-filter`}>{t('filter_label')}</Label>
          <Input
            id={`${id}-filter`}
            type="search"
            autoComplete="off"
            placeholder={t('filter_placeholder')}
            className="h-8 w-52 sm:text-sm"
            {...filterField({
              value: props.query.globalFilter,
              lazy: props.lazy,
              apply: (globalFilter) => {
                props.onChange({ ...props.query, globalFilter, pageIndex: 0 });
              },
            })}
          />
        </div>
      ) : (
        <span />
      )}
      {props.itemsPerPageSelect && (
        <div className="flex items-center gap-2">
          <Label htmlFor={`${id}-page-size`}>{t('items_per_page')}</Label>
          <NativeSelect
            id={`${id}-page-size`}
            size="sm"
            className="w-20"
            value={props.query.pageSize}
            onChange={(event) => {
              props.onChange({
                ...props.query,
                pageSize: Number(event.target.value),
                pageIndex: 0,
              });
            }}
          >
            {PAGE_SIZES.map((size) => (
              <NativeSelectOption key={size} value={size}>
                {size}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      )}
    </div>
  );
};

type DataTableProps<TData> = TableStyle & {
  data: TData[];
  columns: DataColumn<TData>[];
  getRowId: (row: TData) => string;
  /** Accessible name of the table. */
  caption: string;
  /** Rows per page at first (default 10). */
  itemsPerPage?: number;
  /** Let the reader change the rows per page. */
  itemsPerPageSelect?: boolean;
  /** Show page buttons; `doubleArrows` adds first/last. */
  pagination?: boolean | { doubleArrows?: boolean; align?: 'start' | 'center' | 'end' };
  /** Sort by clicking column heads. */
  sorter?: boolean;
  /** A third click on a sorted head removes the sort. */
  sorterResettable?: boolean;
  /** One search field over every filterable column. */
  tableFilter?: boolean;
  /** A filter field under each filterable column head. */
  columnFilter?: boolean;
  /** Apply filters on change (blur or Enter) instead of on every keystroke. */
  lazyFilters?: boolean;
  /** Dim the rows and show a spinner, e.g. while a backend answers. */
  loading?: boolean;
  onRowClick?: (row: TData) => void;
  /** A details panel each row can open below itself. */
  renderDetails?: (row: TData) => React.ReactNode;
  /** A checkbox on each row, a select-all box and the selected count. */
  selectable?: boolean;
  /** Clicking a row toggles its checkbox. */
  selectOnRowClick?: boolean;
  rowClassName?: (row: TData) => string | undefined;
  /** Rendered above the table with every row the filters let through, in display order. */
  toolbar?: (rows: TData[]) => React.ReactNode;
  /** Controlled query; pair it with `onQueryChange`. */
  query?: TableQuery;
  onQueryChange?: (query: TableQuery) => void;
  /** Total rows on the server: the table then trusts `data` as the current, processed page. */
  rowCount?: number;
};

/**
 * The data table of the showcase (CoreUI's `CDataTable`): sorting, table and column filters,
 * rows per page, pagination, clickable rows, row details, selection, a loading overlay and the
 * empty view, in the Marksheet table styles.
 * @param props Component props.
 * @returns The table with its controls.
 */
export const DataTable = <TData extends RowData>(props: DataTableProps<TData>) => {
  const t = useTranslations('DataTable');
  const id = useId();
  const [ownQuery, setOwnQuery] = useState(() => initialQuery(props.itemsPerPage ?? 10));
  const [selection, setSelection] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const query = props.query ?? ownQuery;
  const manual = props.rowCount !== undefined;
  const commit = (next: TableQuery) => {
    if (!props.query) {
      setOwnQuery(next);
    }
    props.onQueryChange?.(next);
  };

  const columns: ColumnDef<typeof features, TData>[] = props.columns.map((column) => ({
    id: column.id,
    accessorFn: (row: TData) => column.value(row),
    enableColumnFilter: column.filterable !== false,
    enableGlobalFilter: column.filterable !== false,
    filterFn: 'includesString',
    sortFn: 'alphanumeric',
  }));
  const table = useTable({
    features,
    columns,
    data: props.data,
    getRowId: (row) => props.getRowId(row),
    state: {
      sorting: query.sorting,
      columnFilters: query.columnFilters,
      globalFilter: query.globalFilter,
      pagination: { pageIndex: query.pageIndex, pageSize: query.pageSize },
    },
    globalFilterFn: 'includesString',
    // Every change goes through `commit`, which resets the page itself.
    autoResetPageIndex: false,
    manualFiltering: manual,
    manualSorting: manual,
    manualPagination: manual,
    rowCount: props.rowCount,
  });

  const { rows } = table.getRowModel();
  const filteredRows = table.getPrePaginatedRowModel().rows;
  const pageCount = Math.ceil((props.rowCount ?? filteredRows.length) / query.pageSize);
  const details = props.renderDetails !== undefined;
  const columnCount = props.columns.length + (props.selectable ? 1 : 0) + (details ? 1 : 0);
  const pagination = typeof props.pagination === 'object' ? props.pagination : {};
  const clickable = props.onRowClick !== undefined || props.selectOnRowClick === true;

  const selectedCount = Object.values(selection).filter(Boolean).length;
  const filteredIds = filteredRows.map((row) => row.id);
  const allSelected = filteredIds.length > 0 && filteredIds.every((rowId) => selection[rowId]);
  const someSelected = filteredIds.some((rowId) => selection[rowId]);
  const setSelected = (rowId: string, value: boolean) => {
    setSelection((current) => ({ ...current, [rowId]: value }));
  };

  const emptyMessages = {
    loading: t('loading'),
    no_results: t('no_results'),
    no_items: t('no_items'),
  };
  const emptyMessage = emptyMessages[emptyMessageKey({ loading: props.loading, query })];

  return (
    <div className="flex flex-col gap-4">
      <TableControls
        query={query}
        tableFilter={props.tableFilter}
        itemsPerPageSelect={props.itemsPerPageSelect}
        lazy={props.lazyFilters}
        onChange={commit}
      />

      {props.toolbar?.(filteredRows.map((row) => row.original))}

      <div className="relative" aria-busy={props.loading ? true : undefined}>
        <Table className={styleClasses(props)}>
          <caption className="sr-only">{props.caption}</caption>
          <TableHeader>
            <HeadRow
              columns={props.columns}
              sorting={query.sorting}
              sorter={props.sorter}
              details={details}
              onSort={(columnId) => {
                commit({
                  ...query,
                  sorting: nextSorting({
                    sorting: query.sorting,
                    columnId,
                    resettable: props.sorterResettable === true,
                  }),
                });
              }}
              selectAll={
                props.selectable
                  ? {
                      checked: allSelected || (someSelected && 'indeterminate'),
                      onToggle: () => {
                        setSelection((current) => ({
                          ...current,
                          ...Object.fromEntries(filteredIds.map((rowId) => [rowId, !allSelected])),
                        }));
                      },
                    }
                  : undefined
              }
            />
            {props.columnFilter && (
              <FilterRow
                columns={props.columns}
                filters={query.columnFilters}
                lazy={props.lazyFilters}
                selectable={props.selectable}
                details={details}
                onFilter={(columnId, value) => {
                  commit({
                    ...query,
                    columnFilters: [
                      ...query.columnFilters.filter((filter) => filter.id !== columnId),
                      ...(value === '' ? [] : [{ id: columnId, value }]),
                    ],
                    pageIndex: 0,
                  });
                }}
              />
            )}
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columnCount} className="whitespace-normal">
                  <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
                    <SearchXIcon aria-hidden="true" className="size-6 opacity-60" />
                    <p className="font-semibold">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => {
              const item = row.original;
              const selected = selection[row.id] === true;

              return (
                <DataRow
                  key={row.id}
                  item={item}
                  label={String(props.columns[0]?.value(item) ?? row.id)}
                  columns={props.columns}
                  columnCount={columnCount}
                  detailsId={`${id}-details-${row.id}`}
                  selected={props.selectable ? selected : undefined}
                  onSelect={(value) => {
                    setSelected(row.id, value);
                  }}
                  open={expanded[row.id] === true}
                  onToggleDetails={() => {
                    setExpanded((current) => ({ ...current, [row.id]: !current[row.id] }));
                  }}
                  renderDetails={props.renderDetails}
                  className={props.rowClassName?.(item)}
                  onClick={
                    clickable
                      ? () => {
                          if (props.selectOnRowClick) {
                            setSelected(row.id, !selected);
                          }
                          props.onRowClick?.(item);
                        }
                      : undefined
                  }
                />
              );
            })}
          </TableBody>
        </Table>
        {props.loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-paper-card/70">
            <Spinner className="size-6 text-folder" label={t('loading')} />
          </div>
        )}
      </div>

      {props.selectable && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-ink-600">
          <output aria-live="polite" className="tabular-nums">
            {t('selected_count', { count: selectedCount })}
          </output>
          {selectedCount > 0 && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={() => {
                setSelection({});
              }}
            >
              {t('clear_selection')}
            </Button>
          )}
        </div>
      )}

      {props.pagination && (
        <TablePagination
          page={query.pageIndex + 1}
          pages={pageCount}
          doubleArrows={pagination.doubleArrows}
          align={pagination.align}
          onPageChange={(page) => {
            commit({ ...query, pageIndex: page - 1 });
          }}
        />
      )}
    </div>
  );
};

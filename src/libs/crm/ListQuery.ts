import { toRecordId } from './WorkspaceId';

/** The page sizes a list offers; the first is the default. */
export const PAGE_SIZES = [20, 50, 100] as const;

// The largest `page × size` the backend takes (a Java int): a larger page is a 400.
const MAX_OFFSET = 2 ** 31 - 1;
// The id filters that also take `unassigned` (api.md, Conventions: Lists).
const OWNER_FILTERS = new Set(['ownerId', 'assigneeId']);
// The sorts that run newest or largest first without a `direction` (api.md, Lists).
const DESCENDING_SORTS = new Set(['CREATED_AT', 'UPDATED_AT', 'AMOUNT', 'PRIORITY']);

type Direction = 'ASC' | 'DESC';

/**
 * How a filter's URL value is read: a record id, trimmed text, a real `YYYY-MM-DD` date,
 * `true` or `false`, or one of a list of values (several with `multiple`).
 */
type FilterKind = 'id' | 'text' | 'date' | 'bool' | { enum: readonly string[]; multiple?: boolean };

/** What a list endpoint takes: its sorts, the default one, and its filters by param name. */
export type ListSpec = {
  sorts: readonly string[];
  defaultSort: string;
  filters: Record<string, FilterKind>;
};

type FilterValue<K> = K extends 'id'
  ? number
  : K extends 'bool'
    ? boolean
    : K extends { enum: readonly (infer E)[]; multiple: true }
      ? E[]
      : K extends { enum: readonly (infer E)[] }
        ? E
        : string;

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * A list's state as its URL holds it, with every invalid value dropped: the fields are what the
 * backend's list endpoint takes, `params` the same state as URL params, for links.
 */
export type ListQuery<S extends ListSpec = ListSpec> = {
  page: number;
  size: number;
  sort: S['sorts'][number] | S['defaultSort'];
  direction?: Direction;
  q?: string;
  archived?: true;
  /** Only the records without an owner (`ownerId=unassigned` in the URL). */
  unassigned?: true;
  filters: { [K in keyof S['filters']]?: FilterValue<S['filters'][K]> };
  /** The valid params, defaults left out: what `listHref` starts from. */
  params: Record<string, string | string[]>;
};

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// Searched text without NUL characters, which the backend refuses (400 on `q`, 500 on others).
const withoutNul = (value: string) => value.replaceAll('\u0000', '');

/**
 * Tells whether a value is a calendar date that exists (`2024-02-29`, not `2026-02-30`).
 * @param value The URL value.
 * @returns Whether it is one.
 */
const isDate = (value: string) => {
  const time = Date.parse(`${value}T00:00:00Z`);
  return (
    /^\d{4}-\d{2}-\d{2}$/u.test(value) &&
    !Number.isNaN(time) &&
    new Date(time).toISOString().startsWith(value)
  );
};

type Read = { value: string | number | boolean | string[]; param: string | string[] } | null;

/**
 * Reads a filter that takes one of a list of values, or several of them.
 * @param kind The values it takes.
 * @param raw Its URL value (repeated params give several).
 * @returns The values for the backend and for the URL, or null when none is valid.
 */
const readEnum = (
  kind: { enum: readonly string[]; multiple?: boolean },
  raw: string | string[] | undefined,
): Read => {
  const values = [...new Set([raw ?? []].flat())].filter((item) => kind.enum.includes(item));
  if (kind.multiple) {
    return values.length > 0 ? { value: values, param: values } : null;
  }
  const [value] = values;

  return value === undefined ? null : { value, param: value };
};

// How each kind of single-value filter is read: the value for the backend and for the URL, or
// null when it isn't valid.
const READERS: Record<Exclude<FilterKind, object>, (value: string) => Read> = {
  id: (value) => {
    const id = toRecordId(value);
    return id === undefined ? null : { value: id, param: value };
  },
  date: (value) => (isDate(value) ? { value, param: value } : null),
  bool: (value) =>
    value === 'true' || value === 'false' ? { value: value === 'true', param: value } : null,
  text: (value) => {
    const text = withoutNul(value).trim();
    return text ? { value: text, param: text } : null;
  },
};

/**
 * Reads a list's filters from the URL into `params`; `ownerId=unassigned` (tasks:
 * `assigneeId`) is the `unassigned` filter.
 * @param spec The list's filters.
 * @param searchParams The page's search params.
 * @param params The valid URL params, to add to.
 * @returns The filters for the backend, and whether only unassigned records are asked for.
 */
const readFilters = (
  spec: ListSpec['filters'],
  searchParams: SearchParams,
  params: Record<string, string | string[]>,
) => {
  const filters: Record<string, string | number | boolean | string[]> = {};
  let unassigned = false;
  for (const [key, kind] of Object.entries(spec)) {
    const raw = searchParams[key];
    const value = first(raw);
    if (kind === 'id' && OWNER_FILTERS.has(key) && value === 'unassigned') {
      unassigned = true;
      params[key] = 'unassigned';
      continue;
    }
    let read: Read = null;
    if (typeof kind === 'object') {
      read = readEnum(kind, raw);
    } else if (value !== undefined) {
      read = READERS[kind](value);
    }
    if (read) {
      filters[key] = read.value;
      params[key] = read.param;
    }
  }

  return { filters, unassigned };
};

/**
 * Reads the page and its size: a size the list offers, and a plain whole page number within the
 * largest offset the backend takes.
 * @param searchParams The page's search params.
 * @returns The page (0 when invalid) and the size (20 when invalid).
 */
const readPaging = (searchParams: SearchParams) => {
  const size = PAGE_SIZES.find((item) => String(item) === first(searchParams.size)) ?? 20;
  const page = first(searchParams.page) ?? '';
  const valid = /^\d{1,10}$/u.test(page) && Number(page) * size <= MAX_OFFSET;

  return { page: valid ? Number(page) : 0, size };
};

/**
 * Reads a list's state from its URL. Hand-edited values the list can't take are dropped, so the
 * page renders with the defaults for them: page 0, size 20, the default sort, no filter.
 * @param spec What the list takes.
 * @param searchParams The page's search params.
 * @returns The list query.
 */
export const parseListQuery = <S extends ListSpec>(
  spec: S,
  searchParams: SearchParams,
): ListQuery<S> => {
  // In the order links write them: search, filters, view, sort, page.
  const params: Record<string, string | string[]> = {};
  const q = withoutNul(first(searchParams.q) ?? '').trim();
  if (q) {
    params.q = q;
  }
  const { filters, unassigned } = readFilters(spec.filters, searchParams, params);
  const archived = first(searchParams.archived) === 'true';
  if (archived) {
    params.archived = 'true';
  }
  const sort = spec.sorts.find((item) => item === first(searchParams.sort)) ?? spec.defaultSort;
  if (sort !== spec.defaultSort) {
    params.sort = sort;
  }
  const direction = (['ASC', 'DESC'] as const).find(
    (item) => item === first(searchParams.direction),
  );
  if (direction) {
    params.direction = direction;
  }
  const { page, size } = readPaging(searchParams);
  if (page > 0) {
    params.page = String(page);
  }
  if (size !== PAGE_SIZES[0]) {
    params.size = String(size);
  }

  return {
    page,
    size,
    sort,
    ...(direction && { direction }),
    ...(q && { q }),
    ...(archived && { archived }),
    ...(unassigned && { unassigned }),
    // Each value was read by its spec's kind, which is what this type maps the kinds to.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- see above
    filters: filters as ListQuery<S>['filters'],
    params,
  };
};

/**
 * The direction a sort takes without `direction`: dates, amounts and priorities descending,
 * names and due dates ascending.
 * @param sort The sort.
 * @returns Its own direction.
 */
export const naturalDirection = (sort: string): Direction =>
  DESCENDING_SORTS.has(sort) ? 'DESC' : 'ASC';

/**
 * A link to the same list with some params changed. Changing anything but the page goes back to
 * the first page, whose items the new search, filter, sort or size changed.
 * @param path The list's path.
 * @param query The current list query.
 * @param changes Params to set; `undefined` removes one.
 * @returns The path with its query string.
 */
export const listHref = (
  path: string,
  query: Pick<ListQuery, 'params'>,
  changes: Record<string, string | string[] | undefined>,
) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query.params, page: undefined, ...changes })) {
    for (const item of [value ?? []].flat()) {
      if (item !== '') {
        search.append(key, item);
      }
    }
  }
  const text = search.toString();

  return text ? `${path}?${text}` : path;
};

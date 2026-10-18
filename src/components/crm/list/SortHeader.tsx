import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref, naturalDirection } from '@/libs/crm/ListQuery';
import { Link } from '@/libs/I18nNavigation';

const OPPOSITE = { ASC: 'DESC', DESC: 'ASC' } as const;
const ICONS = { ASC: ArrowUpIcon, DESC: ArrowDownIcon };
const ARIA_SORT = { ASC: 'ascending', DESC: 'descending' } as const;

/**
 * A sortable column's head: a link that sorts by the column, in its own direction first (names
 * A to Z, dates newest first), then the other way. The sorted column carries `aria-sort`.
 * @param props Component props.
 * @param props.label The column's name.
 * @param props.sort The sort it applies, such as `NAME`.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @param props.className Extra classes for the cell.
 * @returns The header cell.
 */
export const SortHeader = (props: {
  label: string;
  sort: string;
  path: string;
  query: ListQuery;
  className?: string;
}) => {
  const natural = naturalDirection(props.sort);
  const active = props.query.sort === props.sort;
  const direction = props.query.direction ?? natural;
  // The next click: the other way round, or back to its own direction, which needs no param.
  const next = active && direction === natural ? OPPOSITE[natural] : undefined;
  const Icon = active ? ICONS[direction] : ArrowUpDownIcon;

  return (
    <TableHead aria-sort={active ? ARIA_SORT[direction] : undefined} className={props.className}>
      <Link
        href={listHref(props.path, props.query, { sort: props.sort, direction: next })}
        scroll={false}
        className="-mx-1 inline-flex items-center gap-1 rounded-sm px-1 py-0.5 text-inherit no-underline hover:text-foreground"
      >
        {props.label}
        <Icon aria-hidden="true" className={active ? 'size-3.5 text-foreground' : 'size-3.5'} />
      </Link>
    </TableHead>
  );
};

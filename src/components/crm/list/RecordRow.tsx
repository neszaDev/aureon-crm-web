import { TableCell, TableRow } from '@/components/ui/table';
import { Link } from '@/libs/I18nNavigation';

/**
 * A list's 36 px row: the record's name as the link that opens it, its number dimmed beside it,
 * the row's own cells, then its "…" menu. A long name is cut short, whole in its tooltip.
 * @param props Component props.
 * @param props.name The record's name.
 * @param props.href Its page.
 * @param props.number Its record number, such as `C-0012`.
 * @param props.menu Its `RowMenu`, when the caller may change it.
 * @param props.children The other cells.
 * @returns The row.
 */
export const RecordRow = (props: {
  name: string;
  href: string;
  number: string;
  menu?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <TableRow className="group/row">
    <TableCell>
      <span className="flex min-w-0 items-baseline gap-2">
        <Link
          href={props.href}
          title={props.name}
          className="truncate font-medium text-foreground no-underline hover:underline"
        >
          {props.name}
        </Link>
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
          {props.number}
        </span>
      </span>
    </TableCell>
    {props.children}
    <TableCell className="w-10 py-0 pr-2 text-right">{props.menu}</TableCell>
  </TableRow>
);

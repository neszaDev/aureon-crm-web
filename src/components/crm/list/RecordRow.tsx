import { SelectCell } from '@/components/crm/list/BulkSelect';
import { TableCell, TableRow } from '@/components/ui/table';
import { Link } from '@/libs/I18nNavigation';

/**
 * A list's 36 px row: the box that selects it for a bulk action, the record's name as the link
 * that opens it, its number dimmed beside it, the row's own cells, then its "…" menu. A long name
 * is cut short, whole in its tooltip. On a phone the number yields its room to the name, which
 * wraps, and `detail` is a second line under it (what the hidden columns would say); the menu is a
 * 36 px control. Selected, it takes the violet tint.
 * @param props Component props.
 * @param props.id The record.
 * @param props.name The record's name.
 * @param props.href Its page.
 * @param props.number Its record number, such as `C-0012`.
 * @param props.menu Its `RowMenu`, when the caller may change it.
 * @param props.detail A phone's second line: what matters most of the columns it hides.
 * @param props.children The other cells.
 * @returns The row.
 */
export const RecordRow = (props: {
  id: number;
  name: string;
  href: string;
  number: string;
  menu?: React.ReactNode;
  detail?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <TableRow className="group/row has-[[data-select-id][data-state=checked]]:bg-violet-tint">
    <SelectCell id={props.id} name={props.name} />
    <TableCell className="max-sm:whitespace-normal">
      <span className="flex min-w-0 items-baseline gap-2">
        <Link
          href={props.href}
          title={props.name}
          className="min-w-0 font-medium break-words text-foreground no-underline hover:underline sm:truncate"
        >
          {props.name}
        </Link>
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums max-sm:hidden">
          {props.number}
        </span>
      </span>
      {props.detail && (
        <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.8125rem] text-muted-foreground sm:hidden">
          {props.detail}
        </span>
      )}
    </TableCell>
    {props.children}
    <TableCell className="w-10 py-0 pr-2 text-right max-sm:w-11 max-sm:px-1">
      {props.menu}
    </TableCell>
  </TableRow>
);

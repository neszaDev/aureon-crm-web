import { SelectCell } from '@/components/crm/list/BulkSelect';
import { TableCell, TableRow } from '@/components/ui/table';
import { Link } from '@/libs/I18nNavigation';

/**
 * A list's 36 px row: the box that selects it for a bulk action, the record's name as the link
 * that opens it, its number dimmed beside it, the row's own cells, then its "…" menu. On a phone
 * the number yields its room to the name. A long name is cut short, whole in its tooltip. Selected,
 * it takes the violet tint.
 * @param props Component props.
 * @param props.id The record.
 * @param props.name The record's name.
 * @param props.href Its page.
 * @param props.number Its record number, such as `C-0012`.
 * @param props.menu Its `RowMenu`, when the caller may change it.
 * @param props.children The other cells.
 * @returns The row.
 */
export const RecordRow = (props: {
  id: number;
  name: string;
  href: string;
  number: string;
  menu?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <TableRow className="group/row has-[[data-select-id][data-state=checked]]:bg-violet-tint">
    <SelectCell id={props.id} name={props.name} />
    <TableCell>
      <span className="flex min-w-0 items-baseline gap-2">
        <Link
          href={props.href}
          title={props.name}
          className="truncate font-medium text-foreground no-underline hover:underline"
        >
          {props.name}
        </Link>
        <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums max-sm:hidden">
          {props.number}
        </span>
      </span>
    </TableCell>
    {props.children}
    <TableCell className="w-10 py-0 pr-2 text-right">{props.menu}</TableCell>
  </TableRow>
);

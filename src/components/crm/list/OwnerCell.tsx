import { useTranslations } from 'next-intl';
import { Seal } from '@/components/crm/Seal';
import { TableCell } from '@/components/ui/table';
import type { components } from '@/libs/api/schema';

/**
 * A list row's owner: their seal and name on one line, or "Unassigned". A name too long for the
 * cell is cut short, in full as the cell's title.
 * @param props Component props.
 * @param props.owner The record's owner, if any.
 * @param props.className Extra classes for the cell, such as hiding it on small screens.
 * @returns The table cell.
 */
export const OwnerCell = (props: {
  owner?: components['schemas']['MemberRef'];
  className?: string;
}) => {
  const t = useTranslations('RecordList');

  return (
    <TableCell className={props.className}>
      {props.owner ? (
        <span className="flex items-center gap-2">
          <Seal name={props.owner.displayName} email={props.owner.email} size="sm" />
          <span
            title={props.owner.displayName ?? props.owner.email}
            className="max-w-40 min-w-0 truncate"
          >
            {props.owner.displayName ?? props.owner.email}
          </span>
        </span>
      ) : (
        <span className="text-muted-foreground">{t('unassigned')}</span>
      )}
    </TableCell>
  );
};

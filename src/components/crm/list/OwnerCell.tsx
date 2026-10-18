import { useTranslations } from 'next-intl';
import { Seal } from '@/components/crm/Seal';
import { TableCell } from '@/components/ui/table';
import type { components } from '@/libs/api/schema';

/**
 * A list row's owner: their seal and name, or "Unassigned". The name wraps rather than
 * truncating, as touch and keyboard users can't hover a title.
 * @param props Component props.
 * @param props.owner The record's owner, if any.
 * @returns The table cell.
 */
export const OwnerCell = (props: { owner?: components['schemas']['MemberRef'] }) => {
  const t = useTranslations('RecordList');

  return (
    <TableCell className="whitespace-normal">
      {props.owner ? (
        <span className="flex items-center gap-2">
          <Seal name={props.owner.displayName} email={props.owner.email} size="sm" />
          <span className="max-w-40 min-w-0 break-words">
            {props.owner.displayName ?? props.owner.email}
          </span>
        </span>
      ) : (
        <span className="text-muted-foreground">{t('unassigned')}</span>
      )}
    </TableCell>
  );
};

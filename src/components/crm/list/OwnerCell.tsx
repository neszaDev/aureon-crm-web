import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import { TableCell } from '@/components/ui/table';
import type { components } from '@/libs/api/schema';

/**
 * A record's owner on a phone row's second line (`RecordRow`'s `detail`): their small avatar and
 * name, or the dashed ring and "Unassigned". The name wraps, since a phone can't hover a title;
 * with no column head there, assistive technology hears what it is first.
 * @param props Component props.
 * @param props.owner The record's owner, if any.
 * @param props.label What it is, such as "Owner", read out before it.
 * @returns The owner.
 */
export const OwnerName = (props: { owner?: components['schemas']['MemberRef']; label: string }) => {
  const t = useTranslations('RecordList');

  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <PersonAvatar person={props.owner} size="xs" />
      <span className="min-w-0 break-words">
        <span className="sr-only">{`${props.label} `}</span>
        {props.owner ? (props.owner.displayName ?? props.owner.email) : t('unassigned')}
      </span>
    </span>
  );
};

/**
 * A list row's owner: their avatar and name, or "Unassigned". From 640 px the name keeps to one
 * line, and one too long for the cell is cut short, in full as its title; below that it wraps,
 * since a phone can't hover a title.
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
    <TableCell className={cn('max-sm:whitespace-normal', props.className)}>
      {props.owner ? (
        <span className="flex items-center gap-2">
          <PersonAvatar person={props.owner} size="sm" />
          <span
            title={props.owner.displayName ?? props.owner.email}
            className="max-w-40 min-w-0 break-words sm:truncate"
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

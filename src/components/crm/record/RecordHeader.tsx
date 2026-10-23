import { useTranslations } from 'next-intl';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import { Badge } from '@/components/ui/badge';
import type { components } from '@/libs/api/schema';

/**
 * The top of a record page: its number in mono, its name (the page's `h1`, focusable so focus
 * can land there after an action), "Archived" or its status when it is, its owner's avatar (a
 * task's assignee), a figure under the name (a deal's amount), and its actions.
 * @param props Component props.
 * @param props.number The record number, such as `C-0042`.
 * @param props.name The record's name.
 * @param props.headingId The `h1`'s id.
 * @param props.owner The owner, if any.
 * @param props.assigned Whether the owner is an assignee ("Assigned to"), as a task's.
 * @param props.archived Whether the record is archived.
 * @param props.status A status to show beside its number: its word, such as "Completed", in an
 *   outlined badge, or a badge of its own, such as a deal's `DealStatusBadge`.
 * @param props.figure A value shown large under the name, such as a deal's amount.
 * @param props.actions Edit, archive or restore, when the caller may.
 * @returns The header.
 */
export const RecordHeader = (props: {
  number: string;
  name: string;
  headingId: string;
  owner?: components['schemas']['MemberRef'];
  assigned?: boolean;
  archived: boolean;
  status?: React.ReactNode;
  figure?: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  const t = useTranslations('RecordHeader');

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
            {props.number}
          </span>
          {/* Sentence case: DESIGN.md's label rule (the primitive's uppercase is the demos'). */}
          {props.archived && (
            <Badge variant="outline" className="text-xs font-medium tracking-normal normal-case">
              {t('archived')}
            </Badge>
          )}
          {typeof props.status === 'string' ? (
            <Badge variant="outline" className="text-xs font-medium tracking-normal normal-case">
              {props.status}
            </Badge>
          ) : (
            props.status
          )}
        </p>
        <h1
          id={props.headingId}
          tabIndex={-1}
          className="rounded-sm text-2xl font-bold tracking-[-0.01em] break-words"
        >
          {props.name}
        </h1>
        {props.figure && <p className="text-lg font-semibold tabular-nums">{props.figure}</p>}
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {props.owner ? (
            <>
              <PersonAvatar person={props.owner} size="sm" />
              {props.assigned
                ? t('assignee', { name: props.owner.displayName ?? props.owner.email })
                : t('owner', { name: props.owner.displayName ?? props.owner.email })}
            </>
          ) : (
            t('unassigned')
          )}
        </p>
      </div>
      {props.actions && <div className="flex shrink-0 flex-wrap gap-2">{props.actions}</div>}
    </header>
  );
};

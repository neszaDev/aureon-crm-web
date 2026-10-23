import { useTranslations } from 'next-intl';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import { Badge } from '@/components/ui/badge';
import type { components } from '@/libs/api/schema';

/**
 * The top of a record, in its panel and on its full page: its number in mono ("Archived" beside
 * it when it is), its name (the `h1`, focusable so focus can land there after an action), a
 * figure under it (a deal's amount), its actions on the right; then its status pill (the control
 * that changes it) beside its owner's avatar and name (a task's assignee), and its whole track
 * (a deal's stages, a lead's lifecycle) across.
 * @param props Component props.
 * @param props.number The record number, such as `C-0042`.
 * @param props.name The record's name.
 * @param props.headingId The `h1`'s id.
 * @param props.owner The owner, if any.
 * @param props.assigned Whether the owner is an assignee ("Assigned to"), as a task's.
 * @param props.archived Whether the record is archived.
 * @param props.status Its status pill, if it has a status.
 * @param props.figure A value shown large under the name, such as a deal's amount.
 * @param props.track Its status track, the current step filled.
 * @param props.actions Edit, archive or restore, log an activity, when the caller may.
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
  track?: React.ReactNode;
  actions?: React.ReactNode;
}) => {
  const t = useTranslations('RecordHeader');
  const owner = props.owner?.displayName ?? props.owner?.email ?? '';

  return (
    <header className="flex flex-col gap-4 border-b border-rule pb-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.75rem] text-muted-foreground tabular-nums">
              {props.number}
            </span>
            {/* Sentence case: DESIGN.md's label rule (the primitive's uppercase is the demos'). */}
            {props.archived && (
              <Badge variant="outline" className="text-xs font-medium tracking-normal normal-case">
                {t('archived')}
              </Badge>
            )}
          </p>
          <h1
            id={props.headingId}
            tabIndex={-1}
            className="rounded-sm text-[1.5rem] leading-tight font-semibold tracking-[-0.01em] break-words"
          >
            {props.name}
          </h1>
          {props.figure && (
            <p className="text-[1.0625rem] font-semibold tabular-nums">{props.figure}</p>
          )}
        </div>
        {props.actions && (
          <div className="flex shrink-0 flex-wrap gap-2 md:max-w-[60%] md:justify-end">
            {props.actions}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-start gap-x-4 gap-y-2">
        {props.status}
        <p className="flex min-h-6 min-w-0 items-center gap-2 text-[0.8125rem] text-muted-foreground">
          {props.owner ? (
            <>
              <PersonAvatar person={props.owner} size="sm" />
              <span className="min-w-0 break-words">
                {props.assigned ? t('assignee', { name: owner }) : t('owner', { name: owner })}
              </span>
            </>
          ) : (
            t('unassigned')
          )}
        </p>
      </div>
      {props.track}
    </header>
  );
};

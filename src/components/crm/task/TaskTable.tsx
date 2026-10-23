import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { TaskRow } from '@/components/crm/task/TaskRow';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { components } from '@/libs/api/schema';
import type { Permission } from '@/libs/crm/Permissions';
import { canEditRecord } from '@/libs/crm/RecordAccess';
import type { DueBounds } from '@/libs/crm/TaskViews';
import { SECTION_TONES, sectionOf } from '@/libs/crm/TaskViews';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';

/**
 * Tasks as a table: the box that completes one, its title and number, its status pill, when it is
 * due, its priority flag, assignee and linked records. A compact one has a menu instead of the
 * pill. Each task's controls work for its assignee, its creator and with `RECORDS_EDIT_ANY`.
 * @param props Component props.
 * @param props.tasks The tasks.
 * @param props.workspaceId The workspace.
 * @param props.permissions The caller's permissions.
 * @param props.me The caller's user id.
 * @param props.timeZone The workspace's time zone.
 * @param props.viewed The record whose page this is, left out of the linked records.
 * @param props.headingId The heading of the list, which takes the focus when a row leaves.
 * @param props.compact A narrow list (the dashboard's): without the status, priority and assignee
 *   columns.
 * @param props.bounds Where the due sections part: an open task's due time takes its section's
 *   colour.
 * @param props.fixed Fixed columns, so the groups of a grouped list line up.
 * @returns The table.
 */
export const TaskTable = (props: {
  tasks: components['schemas']['TaskResponse'][];
  workspaceId: number;
  permissions: Permission[];
  me: number;
  timeZone: string;
  viewed?: ActivityLink;
  headingId: string;
  compact?: boolean;
  bounds?: DueBounds;
  fixed?: boolean;
}) => {
  const t = useTranslations('TaskTable');
  const { bounds } = props;

  return (
    <Table className={cn(props.fixed && 'table-fixed')}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 pr-0">
            <span className="sr-only">{t('done')}</span>
          </TableHead>
          <TableHead>{t('title')}</TableHead>
          {!props.compact && (
            <TableHead title={t('status')} className={cn(props.fixed && 'w-32', 'truncate')}>
              {t('status')}
            </TableHead>
          )}
          <TableHead
            title={t('due')}
            className={cn(props.fixed && 'w-[17%]', 'truncate', !props.compact && 'max-sm:hidden')}
          >
            {t('due')}
          </TableHead>
          {!props.compact && (
            <>
              <TableHead
                title={t('priority')}
                className={cn(props.fixed && 'w-20', 'truncate max-md:hidden')}
              >
                {t('priority')}
              </TableHead>
              <TableHead
                title={t('assignee')}
                className={cn(props.fixed && 'w-[15%]', 'truncate max-md:hidden')}
              >
                {t('assignee')}
              </TableHead>
              <TableHead
                title={t('linked')}
                className={cn(props.fixed && 'w-[16%]', 'truncate max-lg:hidden')}
              >
                {t('linked')}
              </TableHead>
            </>
          )}
          {props.compact && (
            <TableHead className="w-10 pl-0">
              <span className="sr-only">{t('actions')}</span>
            </TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            workspaceId={props.workspaceId}
            canEdit={canEditRecord(
              { permissions: props.permissions },
              props.me,
              task.assignee?.userId,
              task.createdBy?.userId,
            )}
            timeZone={props.timeZone}
            dueTone={
              bounds && task.status === 'OPEN' ? SECTION_TONES[sectionOf(task, bounds)] : undefined
            }
            viewed={props.viewed}
            headingId={props.headingId}
            compact={props.compact}
          />
        ))}
      </TableBody>
    </Table>
  );
};

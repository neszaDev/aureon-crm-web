import { useTranslations } from 'next-intl';
import { TaskRow } from '@/components/crm/task/TaskRow';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { components } from '@/libs/api/schema';
import type { Permission } from '@/libs/crm/Permissions';
import { canEditRecord } from '@/libs/crm/RecordAccess';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';

/**
 * Tasks as a table: the box that completes one, its title and number, when it is due, its
 * priority, assignee and linked records, and its menu. Each task's controls show to its
 * assignee, its creator and with `RECORDS_EDIT_ANY`.
 * @param props Component props.
 * @param props.tasks The tasks.
 * @param props.workspaceId The workspace.
 * @param props.permissions The caller's permissions.
 * @param props.me The caller's user id.
 * @param props.timeZone The workspace's time zone.
 * @param props.viewed The record whose page this is, left out of the linked records.
 * @param props.headingId The heading of the list, which takes the focus when a row leaves.
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
}) => {
  const t = useTranslations('TaskTable');

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10 pr-0">
            <span className="sr-only">{t('done')}</span>
          </TableHead>
          <TableHead>{t('title')}</TableHead>
          <TableHead>{t('due')}</TableHead>
          <TableHead className="max-md:hidden">{t('priority')}</TableHead>
          <TableHead className="max-sm:hidden">{t('assignee')}</TableHead>
          <TableHead className="max-lg:hidden">{t('linked')}</TableHead>
          <TableHead className="w-10 pl-0">
            <span className="sr-only">{t('actions')}</span>
          </TableHead>
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
            viewed={props.viewed}
            headingId={props.headingId}
          />
        ))}
      </TableBody>
    </Table>
  );
};

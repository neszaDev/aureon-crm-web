import { useLocale, useTranslations } from 'next-intl';
import { LinkedRecords } from '@/components/crm/record/LinkedRecords';
import { RecordFacts } from '@/components/crm/record/RecordFacts';
import { Seal } from '@/components/crm/Seal';
import { TaskDue } from '@/components/crm/task/TaskRow';
import type { components } from '@/libs/api/schema';
import { formatInstant } from '@/libs/crm/Format';

/**
 * A task's details on its page: when it is due (an overdue one says so), its priority, the
 * records it is on, who created it, when it was completed, and its description.
 * @param props Component props.
 * @param props.task The task.
 * @param props.workspaceId The workspace.
 * @param props.timeZone The workspace's time zone.
 * @returns The facts panel.
 */
export const TaskFacts = (props: {
  task: components['schemas']['TaskResponse'];
  workspaceId: number;
  timeZone: string;
}) => {
  const t = useTranslations('TaskPage');
  const tRow = useTranslations('TaskRow');
  const locale = useLocale();
  const linked = [props.task.company, props.task.contact, props.task.lead, props.task.deal].some(
    Boolean,
  );

  return (
    <RecordFacts
      label={t('details')}
      facts={[
        {
          label: t('due'),
          value: (
            <TaskDue
              dueAt={props.task.dueAt}
              overdue={props.task.overdue}
              timeZone={props.timeZone}
            />
          ),
        },
        { label: t('priority'), value: tRow(`priority_${props.task.priority}`) },
        {
          label: t('linked'),
          // Undefined without one, so the row reads "Not set".
          value: linked ? (
            <LinkedRecords record={props.task} workspaceId={props.workspaceId} />
          ) : undefined,
        },
        {
          label: t('created_by'),
          // Missing once that member left the workspace.
          value: props.task.createdBy ? (
            <span className="flex items-center gap-2">
              <Seal
                name={props.task.createdBy.displayName}
                email={props.task.createdBy.email}
                size="sm"
              />
              {props.task.createdBy.displayName ?? props.task.createdBy.email}
            </span>
          ) : (
            t('created_by_former')
          ),
        },
        {
          label: t('completed_at'),
          value: props.task.completedAt && (
            <span className="tabular-nums">
              {formatInstant(props.task.completedAt, {
                locale,
                timeZone: props.timeZone,
                withTime: true,
              })}
            </span>
          ),
        },
        {
          label: t('description'),
          value: props.task.description && (
            <span className="whitespace-pre-line">{props.task.description}</span>
          ),
        },
      ]}
    />
  );
};

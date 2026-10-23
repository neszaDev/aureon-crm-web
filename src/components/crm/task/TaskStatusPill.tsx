'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import {
  StatusOption,
  StatusRefusal,
  useKeptFocus,
  useStatusChange,
} from '@/components/crm/StatusChange';
import { StatusPill } from '@/components/crm/StatusPill';
import type { components } from '@/libs/api/schema';
import { TASK_STATUS_TONES } from '@/libs/crm/StatusColors';

type Task = components['schemas']['TaskResponse'];

/**
 * A task's status in a list row as its pill, which is also the control: an open task moves to
 * Completed, or to Cancelled once confirmed; a completed or cancelled one back to Open. The pill
 * waits for the server and shows its answer: the new status, or the refusal under it with the
 * old one kept. For a caller who may not change the task it is dimmed and opens nothing, as the
 * row's box is.
 * @param props Component props.
 * @param props.task The task.
 * @param props.workspaceId The workspace.
 * @param props.canEdit Whether the caller may change it.
 * @param props.headingId The list's heading, which takes the focus when the row has left.
 * @returns The pill, with its confirmation.
 */
export const TaskStatusPill = (props: {
  task: Task;
  workspaceId: number;
  canEdit: boolean;
  headingId: string;
}) => {
  const t = useTranslations('TaskRow');
  const [cancelling, setCancelling] = useState(false);
  const key = `task-${props.task.id}`;
  const [cell, markUsed, release] = useKeptFocus(key);
  const change = useStatusChange(release);
  const { status, title } = props.task;
  const run = (action: typeof completeTask, done: string) => {
    change.run(
      async () => await action(props.workspaceId, props.task.id, props.task.version),
      done,
    );
  };
  const option = (target: Task['status'], onSelect: () => void) => (
    <StatusOption
      key={target}
      tone={TASK_STATUS_TONES[target]}
      label={t(`status_${target}`)}
      onSelect={onSelect}
    />
  );

  return (
    <div ref={cell} data-pill={key} className="flex min-w-0 flex-col items-start">
      <StatusPill
        tone={TASK_STATUS_TONES[status]}
        label={t(`status_${status}`)}
        pending={change.isPending}
        disabled={!props.canEdit}
        menu={
          status === 'OPEN'
            ? [
                option('COMPLETED', () => {
                  markUsed();
                  run(completeTask, t('completed', { title }));
                }),
                option('CANCELLED', () => {
                  setCancelling(true);
                }),
              ]
            : option('OPEN', () => {
                markUsed();
                run(reopenTask, t('reopened', { title }));
              })
        }
      />
      <StatusRefusal failure={change.failure} fallback={t('error_generic')} />
      <ConfirmAction
        open={cancelling}
        onOpenChange={setCancelling}
        // The pill, or the list's heading once the cancelled task left the list.
        returnFocus={() =>
          cell.current?.querySelector('button') ??
          document.querySelector<HTMLElement>(`#${CSS.escape(props.headingId)}`)
        }
        title={t('cancel_title', { title })}
        description={t('cancel_text')}
        confirmLabel={t('cancel_task')}
        cancelLabel={t('keep')}
        // Used only once confirmed ("Keep" changes nothing), and released again when refused.
        action={async () => {
          markUsed();
          const result = await cancelTask(props.workspaceId, props.task.id, props.task.version);
          if (result.ok) {
            toast.success(t('cancelled', { title }));
          } else {
            release();
          }
          return result;
        }}
      />
    </div>
  );
};

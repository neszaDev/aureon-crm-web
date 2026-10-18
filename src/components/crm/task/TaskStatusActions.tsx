'use client';

import { CheckIcon, LoaderCircleIcon, RotateCcwIcon, XCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import { toastActionFailure } from '@/utils/ActionToast';
import { focusOnMount } from '@/utils/Focus';
import { useSettle } from '@/utils/SettleAction';

const REOPEN_ID = 'task-reopen';

/**
 * A task page's status buttons: Complete and Cancel (confirmed) an open task, Reopen a completed
 * or cancelled one. Each says so in a toast; a refusal too, with a reload when someone changed
 * the task first. The button that replaces the one pressed takes the focus.
 * @param props Component props.
 * @param props.task The task.
 * @param props.workspaceId The workspace.
 * @returns The buttons.
 */
export const TaskStatusActions = (props: {
  task: components['schemas']['TaskResponse'];
  workspaceId: number;
}) => {
  const t = useTranslations('TaskRow');
  const tError = useTranslations('ActionError');
  const settle = useSettle();
  const [isPending, startTransition] = useTransition();
  const [moved, setMoved] = useState(false);
  const run = (action: typeof completeTask, done: string) => {
    if (isPending) {
      return;
    }
    startTransition(async () => {
      const result = await settle(action(props.workspaceId, props.task.id, props.task.version));
      if (result.ok) {
        setMoved(true);
        toast.success(done);
      } else {
        toastActionFailure(result, t('error_generic'), tError('reload'));
      }
    });
  };
  const icon = (Icon: typeof CheckIcon) =>
    isPending ? (
      <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
    ) : (
      <Icon data-icon="inline-start" />
    );

  if (props.task.status !== 'OPEN') {
    return (
      <Button
        id={REOPEN_ID}
        ref={moved ? focusOnMount : undefined}
        variant="outline"
        // aria-disabled, not disabled: a disabled button drops the focus to the page.
        aria-disabled={isPending || undefined}
        onClick={() => {
          run(reopenTask, t('reopened', { title: props.task.title }));
        }}
      >
        {icon(RotateCcwIcon)}
        {t('reopen')}
      </Button>
    );
  }

  return (
    <>
      <Button
        ref={moved ? focusOnMount : undefined}
        aria-disabled={isPending || undefined}
        onClick={() => {
          run(completeTask, t('completed', { title: props.task.title }));
        }}
      >
        {icon(CheckIcon)}
        {t('complete_button')}
      </Button>
      <ConfirmAction
        trigger={
          <Button variant="outline">
            <XCircleIcon data-icon="inline-start" />
            {t('cancel_task')}
          </Button>
        }
        title={t('cancel_title', { title: props.task.title })}
        description={t('cancel_text')}
        confirmLabel={t('cancel_task')}
        cancelLabel={t('keep')}
        // Cancelled, the task shows Reopen in place of these buttons.
        fallbackFocus={() => document.querySelector<HTMLElement>(`#${REOPEN_ID}`)}
        action={async () => {
          const result = await cancelTask(props.workspaceId, props.task.id, props.task.version);
          if (result.ok) {
            toast.success(t('cancelled', { title: props.task.title }));
          }
          return result;
        }}
      />
    </>
  );
};

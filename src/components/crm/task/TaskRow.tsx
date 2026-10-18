'use client';

import { cn } from 'cn';
import { CircleAlertIcon, EllipsisIcon, RotateCcwIcon, XCircleIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useLayoutEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import { OwnerCell } from '@/components/crm/list/OwnerCell';
import { LinkedRecords } from '@/components/crm/record/LinkedRecords';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell, TableRow } from '@/components/ui/table';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import { formatInstant, recordNumber } from '@/libs/crm/Format';
import { Link } from '@/libs/I18nNavigation';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';

type Task = components['schemas']['TaskResponse'];
type StatusAction = (workspaceId: number, taskId: number, version: number) => Promise<ActionResult>;

/**
 * Shows a refused task action in a toast, with a reload when someone changed the task first.
 * @param result The refusal.
 * @param fallback The message without one from the backend.
 * @param reload The reload button's label.
 */
export const toastTaskFailure = (result: ActionResult, fallback: string, reload: string) => {
  toast.error(result.message ?? fallback, {
    action: result.conflict
      ? {
          label: reload,
          onClick: () => {
            window.location.reload();
          },
        }
      : undefined,
  });
};

/**
 * When a task is due, in the workspace's time zone; an overdue one in crimson with an icon and
 * the word "Overdue", never by colour alone.
 * @param props Component props.
 * @param props.dueAt Its due time, if any.
 * @param props.overdue Whether it is open and past it (the backend says).
 * @param props.timeZone The workspace's time zone.
 * @returns The due time, or "No due date".
 */
export const TaskDue = (props: { dueAt?: string; overdue: boolean; timeZone: string }) => {
  const t = useTranslations('TaskRow');
  const locale = useLocale();
  if (!props.dueAt) {
    return <span className="text-muted-foreground">{t('no_due')}</span>;
  }

  return (
    <span
      className={cn(
        'inline-flex flex-wrap gap-x-1.5 tabular-nums',
        props.overdue && 'font-medium text-danger',
      )}
    >
      {props.overdue && (
        <span className="flex items-center gap-1">
          <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
          {t('overdue')}
        </span>
      )}
      {formatInstant(props.dueAt, { locale, timeZone: props.timeZone, withTime: true })}
    </span>
  );
};

/**
 * A task in a list: a box that completes it (ticked at once, unticked with a toast if refused),
 * its title over its number, when it is due (an overdue one in crimson with the word "Overdue"),
 * its priority, assignee and linked records, and a menu: Reopen a completed or cancelled task,
 * Cancel an open one (confirmed). The controls show only to its assignee, its creator and with
 * `RECORDS_EDIT_ANY`. A row that leaves the list with the focus in it (completed out of an open
 * list) hands the focus to the list's heading.
 * @param props Component props.
 * @param props.task The task.
 * @param props.workspaceId The workspace.
 * @param props.canEdit Whether the caller may complete, reopen and cancel it.
 * @param props.timeZone The workspace's time zone.
 * @param props.viewed The record whose page this is, left out of the linked records.
 * @param props.headingId The list's heading, which takes the focus when the row leaves.
 * @returns The table row.
 */
export const TaskRow = (props: {
  task: Task;
  workspaceId: number;
  canEdit: boolean;
  timeZone: string;
  viewed?: ActivityLink;
  headingId: string;
}) => {
  const t = useTranslations('TaskRow');
  const tError = useTranslations('ActionError');
  const { task } = props;
  const isOpen = task.status === 'OPEN';
  const [ticked, setTicked] = useOptimistic(task.status === 'COMPLETED');
  const [isPending, startTransition] = useTransition();
  const [cancelling, setCancelling] = useState(false);
  const row = useRef<HTMLTableRowElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const heading = () => document.querySelector<HTMLElement>(`#${CSS.escape(props.headingId)}`);

  // Before the row leaves the page (a layout cleanup runs while it is still there): the focus
  // in it would fall to the page's start.
  useLayoutEffect(() => {
    const node = row.current;
    return () => {
      if (node?.contains(document.activeElement)) {
        setTimeout(() => {
          document.querySelector<HTMLElement>(`#${CSS.escape(props.headingId)}`)?.focus();
        }, 0);
      }
    };
  }, [props.headingId]);

  const run = (action: StatusAction, tick = false) => {
    startTransition(async () => {
      if (tick) {
        setTicked(true);
      }
      const result = await action(props.workspaceId, task.id, task.version);
      if (!result.ok) {
        toastTaskFailure(result, t('error_generic'), tError('reload'));
      }
    });
  };

  return (
    <TableRow ref={row} data-state={ticked ? 'done' : undefined}>
      <TableCell className="w-10 pr-0">
        <Checkbox
          checked={ticked}
          aria-label={t('complete', { title: task.title })}
          // aria-disabled, not disabled: a disabled box drops the focus to the page.
          aria-disabled={!isOpen || !props.canEdit || isPending || undefined}
          className={cn(!props.canEdit && 'cursor-not-allowed opacity-50')}
          onCheckedChange={() => {
            if (isOpen && props.canEdit && !isPending) {
              run(completeTask, true);
            }
          }}
        />
      </TableCell>
      <TableCell className="py-2 whitespace-normal">
        <span className="flex min-w-0 flex-col">
          <Link
            href={`/app/${props.workspaceId}/tasks/${task.id}`}
            className={cn(
              'text-[0.9375rem] font-medium break-words text-foreground',
              !isOpen && 'text-muted-foreground line-through',
            )}
          >
            {task.title}
          </Link>
          <span className="flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-muted-foreground">
            <span className="font-mono tabular-nums">{recordNumber('task', task.id)}</span>
            {!isOpen && <span>{t(`status_${task.status}`)}</span>}
          </span>
        </span>
      </TableCell>
      <TableCell className="whitespace-normal">
        <TaskDue dueAt={task.dueAt} overdue={task.overdue} timeZone={props.timeZone} />
      </TableCell>
      <TableCell className="max-md:hidden">{t(`priority_${task.priority}`)}</TableCell>
      <OwnerCell owner={task.assignee} className="max-sm:hidden" />
      <TableCell className="whitespace-normal max-lg:hidden">
        <LinkedRecords record={task} workspaceId={props.workspaceId} viewed={props.viewed} />
      </TableCell>
      <TableCell className="w-10 pl-0 text-right">
        {props.canEdit && (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  ref={menuButton}
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('menu', { title: task.title })}
                >
                  <EllipsisIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOpen ? (
                  <DropdownMenuItem
                    onSelect={() => {
                      setCancelling(true);
                    }}
                  >
                    <XCircleIcon aria-hidden="true" />
                    {t('cancel_task')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    disabled={isPending}
                    onSelect={() => {
                      run(reopenTask);
                    }}
                  >
                    <RotateCcwIcon aria-hidden="true" />
                    {t('reopen')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <ConfirmAction
              open={cancelling}
              onOpenChange={setCancelling}
              // The menu's button, or the list's heading once the cancelled task left the list.
              returnFocus={() => menuButton.current ?? heading()}
              title={t('cancel_title', { title: task.title })}
              description={t('cancel_text')}
              confirmLabel={t('cancel_task')}
              cancelLabel={t('keep')}
              action={async () => {
                const result = await cancelTask(props.workspaceId, task.id, task.version);
                if (result.ok) {
                  toast.success(t('cancelled', { title: task.title }));
                }
                return result;
              }}
            />
          </>
        )}
      </TableCell>
    </TableRow>
  );
};

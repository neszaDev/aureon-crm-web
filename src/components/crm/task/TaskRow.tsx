'use client';

import { cn } from 'cn';
import { CircleAlertIcon, EllipsisIcon, RotateCcwIcon, XCircleIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useLayoutEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cancelTask, completeTask, reopenTask } from '@/actions/crm/TaskActions';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import { SelectCell } from '@/components/crm/list/BulkSelect';
import { OwnerCell } from '@/components/crm/list/OwnerCell';
import { PriorityFlag } from '@/components/crm/PriorityFlag';
import { LinkedRecords } from '@/components/crm/record/LinkedRecords';
import { PILL_SCOPE, pillIn } from '@/components/crm/StatusChange';
import { TaskStatusPill } from '@/components/crm/task/TaskStatusPill';
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
import { instantParts, recordNumber } from '@/libs/crm/Format';
import type { StatusTone } from '@/libs/crm/StatusColors';
import { Link } from '@/libs/I18nNavigation';
import { toastActionFailure } from '@/utils/ActionToast';
import { useSettle } from '@/utils/SettleAction';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';

type Task = components['schemas']['TaskResponse'];
type StatusAction = (workspaceId: number, taskId: number, version: number) => Promise<ActionResult>;

/**
 * When a task is due, in the workspace's time zone; an overdue one in crimson with an icon and
 * the word "Overdue", never by colour alone. In a list, in the colour of its due section, and on
 * one line (in a fixed column, cut short, whole in its tooltip); in the Overdue section, whose
 * heading says it, the word is for assistive technology only.
 * @param props Component props.
 * @param props.dueAt Its due time, if any.
 * @param props.overdue Whether it is open and past it (the backend says).
 * @param props.timeZone The workspace's time zone.
 * @param props.tone The colour of its due section (`TaskViews`), in a list.
 * @param props.line Whether it is a fixed column's: on one line, cut short.
 * @param props.quiet Whether the word "Overdue" is read out but not drawn.
 * @param props.short Writes it short, as a phone's row does ("Oct 20, 4:40 PM"), the year only
 *   outside the one the page was read in (`now`, an ISO instant).
 * @returns The due time, or "No due date".
 */
export const TaskDue = (props: {
  dueAt?: string;
  overdue: boolean;
  timeZone: string;
  tone?: StatusTone;
  line?: boolean;
  quiet?: boolean;
  short?: { now: string };
}) => {
  const t = useTranslations('TaskRow');
  const locale = useLocale();
  if (!props.dueAt) {
    return <span className="text-muted-foreground">{t('no_due')}</span>;
  }
  const due = instantParts(props.dueAt, { locale, timeZone: props.timeZone, short: props.short });
  const look = cn(
    'tabular-nums',
    props.tone && 'text-(--tone-ink)',
    props.overdue && 'font-medium text-danger',
  );
  const icon = props.overdue && (
    <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
  );
  const word = props.overdue && (
    <span className={cn(props.quiet && 'sr-only')}>{`${t('overdue')} `}</span>
  );

  if (props.line) {
    return (
      <span
        data-tone={props.tone}
        title={`${props.overdue ? `${t('overdue')} ` : ''}${due.date}${due.between}${due.time}`}
        className={cn('flex min-w-0 items-center gap-1 whitespace-nowrap', look)}
      >
        {icon}
        <span className="truncate">
          {word}
          {due.date}
          {due.between}
          {due.time}
        </span>
      </span>
    );
  }

  return (
    <span data-tone={props.tone} className={cn('inline-flex flex-wrap gap-x-1.5', look)}>
      {props.overdue && (
        <span className="flex items-center gap-1">
          {icon}
          {word}
        </span>
      )}
      {/* Each part whole: a narrow cell breaks between the date and the time only. */}
      <span>
        <span className="whitespace-nowrap">{due.date}</span>
        {due.between}
        <span className="whitespace-nowrap">{due.time}</span>
      </span>
    </span>
  );
};

/**
 * A task in a list, a 36 px row: a round status circle that completes it (ticked at once, unticked
 * with a toast if refused), its title and its number beside it, its status pill (the control that
 * completes, cancels once confirmed, or reopens it), when it is due (an overdue one in crimson with
 * the word "Overdue", in a list in its due section's colour), its priority flag, assignee and
 * linked records (the first, then "+N"); on a phone the due time and the linked records sit under
 * the title. A compact row (the home's, a record's) has a menu instead of the pill: Reopen a
 * completed or cancelled task, Cancel an open one (confirmed); its linked records follow its title.
 * The controls work only for its assignee, its creator and with `RECORDS_EDIT_ANY`. A row that
 * leaves the list with the focus in it (completed out of an open list) hands the focus to the
 * list's heading.
 * @param props Component props.
 * @param props.task The task.
 * @param props.workspaceId The workspace.
 * @param props.canEdit Whether the caller may complete, reopen and cancel it.
 * @param props.timeZone The workspace's time zone.
 * @param props.dueTone The colour of its due section, in a list.
 * @param props.viewed The record whose page this is, left out of the linked records.
 * @param props.headingId The list's heading, which takes the focus when the row leaves.
 * @param props.compact A narrow list (the home's, a record's): the title, due time and menu only,
 *   the linked records beside the title; status, priority and assignee are left out.
 * @param props.sectioned Whether the row is in a due section, whose heading says "Overdue".
 * @param props.now When the page was read (an ISO instant): a phone's due time leaves out its year.
 * @param props.selectable Whether it starts with the box that selects it for a bulk action
 *   (selected, it takes the violet tint).
 * @returns The table row.
 */
export const TaskRow = (props: {
  task: Task;
  workspaceId: number;
  canEdit: boolean;
  timeZone: string;
  dueTone?: StatusTone;
  viewed?: ActivityLink;
  headingId: string;
  compact?: boolean;
  sectioned?: boolean;
  selectable?: boolean;
  now: string;
}) => {
  const t = useTranslations('TaskRow');
  const tError = useTranslations('ActionError');
  const settle = useSettle();
  const isOpen = props.task.status === 'OPEN';
  const [ticked, setTicked] = useOptimistic(props.task.status === 'COMPLETED');
  const [isPending, startTransition] = useTransition();
  const [cancelling, setCancelling] = useState(false);
  const row = useRef<HTMLTableRowElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const heading = () => document.querySelector<HTMLElement>(`#${CSS.escape(props.headingId)}`);
  const due = (
    <TaskDue
      dueAt={props.task.dueAt}
      overdue={props.task.overdue}
      timeZone={props.timeZone}
      tone={props.dueTone}
      quiet={props.sectioned}
      // The full list's columns are fixed; a compact one sizes them to their content, which wraps
      // where it is narrow (a record's panel) and keeps to one line where it is not (Home).
      line={!props.compact}
    />
  );
  const href = `/app/${props.workspaceId}/tasks/${props.task.id}`;
  const linked = (className: string) => (
    <LinkedRecords
      record={props.task}
      workspaceId={props.workspaceId}
      viewed={props.viewed}
      more={href}
      className={className}
    />
  );

  // Before the row leaves the page (a layout cleanup runs while it is still there): the focus
  // in it would fall to the page's start. The task's pill takes it in its new section (this runs
  // before the pill's own hand-back), else the list's heading.
  useLayoutEffect(() => {
    const node = row.current;
    return () => {
      if (node?.contains(document.activeElement)) {
        const scope = node.closest(PILL_SCOPE) ?? document;
        setTimeout(() => {
          if (document.activeElement === document.body) {
            (
              pillIn(scope, `task-${props.task.id}`) ??
              document.querySelector<HTMLElement>(`#${CSS.escape(props.headingId)}`)
            )?.focus();
          }
        }, 0);
      }
    };
  }, [props.headingId, props.task.id]);

  const run = (action: StatusAction, tick = false) => {
    startTransition(async () => {
      if (tick) {
        setTicked(true);
      }
      const result = await settle(action(props.workspaceId, props.task.id, props.task.version));
      if (!result.ok) {
        toastActionFailure(result, t('error_generic'), tError('reload'));
      }
    });
  };

  return (
    <TableRow
      ref={row}
      data-state={ticked ? 'done' : undefined}
      className="group/row has-[[data-select-id][data-state=checked]]:bg-violet-tint"
    >
      {props.selectable && <SelectCell id={props.task.id} name={props.task.title} />}
      <TableCell className="w-10 pr-0">
        {/* A round status circle, not a second square beside the box that selects the row: done,
            it fills with the green of Completed. */}
        <Checkbox
          checked={ticked}
          data-tone="green"
          aria-label={t('complete', { title: props.task.title })}
          // aria-disabled, not disabled: a disabled box drops the focus to the page.
          aria-disabled={!isOpen || !props.canEdit || isPending || undefined}
          className={cn(
            'rounded-full data-checked:border-(--tone) data-checked:bg-(--tone)',
            !props.canEdit && 'cursor-not-allowed opacity-50',
          )}
          onCheckedChange={() => {
            if (isOpen && props.canEdit && !isPending) {
              run(completeTask, true);
            }
          }}
        />
      </TableCell>
      {/* On a phone the row is two lines anyway (its due time under the title): the title wraps. */}
      <TableCell className={props.compact ? 'whitespace-normal' : 'max-sm:whitespace-normal'}>
        <span className={cn('flex min-w-0 items-baseline gap-x-2', props.compact && 'flex-wrap')}>
          <Link
            href={href}
            title={props.task.title}
            className={cn(
              'font-medium break-words text-foreground no-underline hover:underline',
              !props.compact && 'sm:truncate',
              !isOpen && 'text-muted-foreground line-through',
            )}
          >
            {props.task.title}
          </Link>
          <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums max-sm:hidden">
            {recordNumber('task', props.task.id)}
          </span>
          {props.compact && !isOpen && (
            <span className="shrink-0 text-[0.8125rem] text-muted-foreground">
              {t(`status_${props.task.status}`)}
            </span>
          )}
          {props.compact && linked('ml-auto max-w-[45%] text-[0.8125rem] max-sm:hidden')}
        </span>
        {/* A phone's row has no room for the due and linked columns: they sit under the title, the
            due time short and never cut (it breaks only between its date and its time), the linked
            records on a line of their own when the due time leaves them none. */}
        <span className="flex flex-wrap items-baseline gap-x-2 text-[0.8125rem] sm:hidden">
          <TaskDue
            dueAt={props.task.dueAt}
            overdue={props.task.overdue}
            timeZone={props.timeZone}
            tone={props.dueTone}
            quiet={props.sectioned}
            short={{ now: props.now }}
          />
          {linked('max-w-full')}
        </span>
      </TableCell>
      {!props.compact && (
        // Its width on a phone, whose list has no head row to set it.
        <TableCell className="whitespace-normal max-sm:w-32">
          <TaskStatusPill
            task={props.task}
            workspaceId={props.workspaceId}
            canEdit={props.canEdit}
            headingId={props.headingId}
          />
        </TableCell>
      )}
      <TableCell className="max-sm:hidden">{due}</TableCell>
      {!props.compact && (
        <>
          <TableCell className="max-md:hidden">
            <PriorityFlag priority={props.task.priority} />
          </TableCell>
          <OwnerCell owner={props.task.assignee} className="max-md:hidden" />
          <TableCell className="max-lg:hidden">{linked('')}</TableCell>
        </>
      )}
      {props.compact && (
        <TableCell className="w-10 pl-0 text-right">
          {props.canEdit && (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={menuButton}
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('menu', { title: props.task.title })}
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
                title={t('cancel_title', { title: props.task.title })}
                description={t('cancel_text')}
                confirmLabel={t('cancel_task')}
                cancelLabel={t('keep')}
                action={async () => {
                  const result = await cancelTask(
                    props.workspaceId,
                    props.task.id,
                    props.task.version,
                  );
                  if (result.ok) {
                    toast.success(t('cancelled', { title: props.task.title }));
                  }
                  return result;
                }}
              />
            </>
          )}
        </TableCell>
      )}
    </TableRow>
  );
};

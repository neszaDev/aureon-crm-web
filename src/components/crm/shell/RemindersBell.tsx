'use client';

import { cn } from 'cn';
import { BellIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useLayoutEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import { completeTask } from '@/actions/crm/TaskActions';
import { LeadFollowUp, isFollowUpOverdue } from '@/components/crm/lead/LeadFollowUp';
import { TaskDue } from '@/components/crm/task/TaskRow';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';
import type { components } from '@/libs/api/schema';
import { fullName, recordNumber } from '@/libs/crm/Format';
import { listCount, reminderBadge, reminderCount } from '@/libs/crm/Reminders';
import { todayIn } from '@/libs/crm/ZonedTime';
import { Link } from '@/libs/I18nNavigation';
import { toastActionFailure } from '@/utils/ActionToast';
import { useSettle } from '@/utils/SettleAction';

type Reminders = components['schemas']['RemindersResponse'];
type Task = components['schemas']['TaskResponse'];

const ITEM = 'flex items-start gap-3 px-3 py-2';
const TITLE = 'text-[0.9375rem] font-medium break-words text-foreground';

/**
 * A task to do: a box that completes it (ticked at once, unticked with a toast if refused), its
 * title linking to the task over its number and when it is due. The task is the caller's, so the
 * caller may complete it. When it leaves the list with the focus in it (completed), the focus
 * goes to the popover's heading.
 * @param props Component props.
 * @param props.task The task.
 * @param props.workspaceId The workspace.
 * @param props.timeZone The workspace's time zone.
 * @param props.headingId The popover's heading, which takes the focus when the task leaves.
 * @param props.onNavigate Called when its link is followed, to close the popover.
 * @returns The list item.
 */
const ReminderTask = (props: {
  task: Task;
  workspaceId: number;
  timeZone: string;
  headingId: string;
  onNavigate: () => void;
}) => {
  const t = useTranslations('TaskRow');
  const tError = useTranslations('ActionError');
  const settle = useSettle();
  const [ticked, setTicked] = useOptimistic(false);
  const [isPending, startTransition] = useTransition();
  const item = useRef<HTMLLIElement>(null);

  // Before the item leaves the page (a layout cleanup runs while it is still there): the focus in
  // it would fall to the page's start.
  useLayoutEffect(() => {
    const node = item.current;
    return () => {
      if (node?.contains(document.activeElement)) {
        setTimeout(() => {
          document.querySelector<HTMLElement>(`#${CSS.escape(props.headingId)}`)?.focus();
        }, 0);
      }
    };
  }, [props.headingId]);

  return (
    <li ref={item} className={ITEM}>
      <Checkbox
        checked={ticked}
        aria-label={t('complete', { title: props.task.title })}
        // aria-disabled, not disabled: a disabled box drops the focus to the page.
        aria-disabled={isPending || undefined}
        className="mt-1"
        onCheckedChange={() => {
          if (isPending) {
            return;
          }
          startTransition(async () => {
            setTicked(true);
            const result = await settle(
              completeTask(props.workspaceId, props.task.id, props.task.version),
            );
            if (!result.ok) {
              toastActionFailure(result, t('error_generic'), tError('reload'));
            }
          });
        }}
      />
      <span className="flex min-w-0 flex-col">
        <Link
          href={`/app/${props.workspaceId}/tasks/${props.task.id}`}
          className={TITLE}
          onNavigate={props.onNavigate}
        >
          {props.task.title}
        </Link>
        <span className="flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-muted-foreground">
          <span className="font-mono tabular-nums">{recordNumber('task', props.task.id)}</span>
          <TaskDue
            dueAt={props.task.dueAt}
            overdue={props.task.overdue}
            timeZone={props.timeZone}
          />
        </span>
      </span>
    </li>
  );
};

/**
 * A group of reminders under its heading and count; nothing when it is empty.
 * @param props Component props.
 * @param props.heading The group's name.
 * @param props.length How many it holds.
 * @param props.children Its items.
 * @returns The group.
 */
const Group = (props: { heading: string; length: number; children: React.ReactNode }) => {
  const id = useId();
  if (props.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={id}>
      <h3
        id={id}
        className="flex items-baseline justify-between gap-2 px-3 pt-3 pb-1 text-xs font-semibold text-muted-foreground"
      >
        {props.heading}
        <span className="font-normal tabular-nums">{listCount(props.length)}</span>
      </h3>
      <ul>{props.children}</ul>
    </section>
  );
};

/**
 * The reminders bell: a badge with how many reminders you have (hidden at none) and a popover
 * with them, in three groups: your overdue tasks, your tasks due in the next 24 hours, and the
 * leads whose follow-up is due. Reminders live in the app only; the popover says so. The layout
 * reads them again after every action that refreshes the page, so completing a task, here or on
 * any page, updates the count.
 * @param props Component props.
 * @param props.workspaceId The workspace.
 * @param props.timeZone The workspace's time zone, for due times and "today".
 * @param props.reminders What `GET /reminders` sent; undefined when it could not be read.
 * @param props.className Extra classes for the trigger (colours on the vermilion bar).
 * @returns The bell and its popover.
 */
export const RemindersBell = (props: {
  workspaceId: number;
  timeZone: string;
  reminders?: Reminders;
  className?: string;
}) => {
  const t = useTranslations('RemindersBell');
  const [open, setOpen] = useState(false);
  const headingId = useId();
  const count = props.reminders ? reminderCount(props.reminders) : 0;
  const today = todayIn(props.timeZone);
  const close = () => {
    setOpen(false);
  };
  const taskItems = (tasks: Task[]) =>
    tasks.map((task) => (
      <ReminderTask
        key={task.id}
        task={task}
        workspaceId={props.workspaceId}
        timeZone={props.timeZone}
        headingId={headingId}
        onNavigate={close}
      />
    ));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            props.reminders ? t('label', { count: reminderBadge(props.reminders) }) : t('title')
          }
          className={cn('relative', props.className)}
        >
          <BellIcon />
          {count > 0 && props.reminders && (
            <span
              aria-hidden="true"
              className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-field px-1 text-[0.6875rem] leading-none font-bold text-seal-ink tabular-nums lg:bg-seal lg:text-on-seal"
            >
              {reminderBadge(props.reminders)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        aria-label={t('title')}
        align="end"
        className="w-[min(22rem,calc(100vw-1rem))] gap-0 p-0"
      >
        <PopoverTitle
          id={headingId}
          tabIndex={-1}
          className="border-b border-rule px-3 py-2.5 outline-none"
        >
          {t('title')}
        </PopoverTitle>
        <div className="max-h-[min(24rem,60dvh)] overflow-y-auto pb-2">
          {props.reminders ? (
            <>
              <Group heading={t('overdue')} length={props.reminders.overdueTasks.length}>
                {taskItems(props.reminders.overdueTasks)}
              </Group>
              <Group heading={t('due_soon')} length={props.reminders.dueSoonTasks.length}>
                {taskItems(props.reminders.dueSoonTasks)}
              </Group>
              <Group heading={t('follow_up')} length={props.reminders.followUpLeads.length}>
                {props.reminders.followUpLeads.map((lead) => (
                  <li key={lead.id} className={cn(ITEM, 'pl-10')}>
                    <span className="flex min-w-0 flex-col">
                      <Link
                        href={`/app/${props.workspaceId}/leads/${lead.id}`}
                        className={TITLE}
                        onNavigate={close}
                      >
                        {fullName(lead)}
                      </Link>
                      <span className="flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-muted-foreground">
                        <span className="font-mono tabular-nums">
                          {recordNumber('lead', lead.id)}
                        </span>
                        <LeadFollowUp
                          date={lead.followUpDate}
                          overdue={isFollowUpOverdue(lead, today)}
                        />
                      </span>
                    </span>
                  </li>
                ))}
              </Group>
              {count === 0 && (
                <p className="px-3 py-6 text-center text-muted-foreground">{t('empty')}</p>
              )}
            </>
          ) : (
            <p role="alert" className="px-3 py-6 text-center text-muted-foreground">
              {t('error')}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 border-t border-rule p-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/${props.workspaceId}/tasks?view=mine`} onNavigate={close}>
              {t('all_tasks')}
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">{t('in_app')}</p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

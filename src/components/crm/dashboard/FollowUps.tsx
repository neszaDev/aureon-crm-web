import { useTranslations } from 'next-intl';
import { Panel } from '@/components/crm/dashboard/Panel';
import { isFollowUpOverdue, LeadFollowUp } from '@/components/crm/lead/LeadFollowUp';
import { TaskTable } from '@/components/crm/task/TaskTable';
import type { components } from '@/libs/api/schema';
import { fullName, recordNumber } from '@/libs/crm/Format';
import type { BellReminders } from '@/libs/crm/Reminders';
import { REMINDER_CAP } from '@/libs/crm/Reminders';
import { todayIn } from '@/libs/crm/ZonedTime';
import { Link } from '@/libs/I18nNavigation';

type Task = components['schemas']['TaskResponse'];

// How many tasks the dashboard lists in each group (api.md): a full group may be a cut.
const CAP = 8;
const HEADING = 'follow-ups-heading';

/**
 * One group of the panel: its title with the count, the empty line when there is nothing.
 * @param props Component props.
 * @param props.title The group's title.
 * @param props.items How many rows there are.
 * @param props.count How many there are, as shown (a cut list says so).
 * @param props.empty What it says when there are none.
 * @param props.children The rows.
 * @returns The group.
 */
const Group = (props: {
  title: string;
  items: number;
  count: string;
  empty: string;
  children: React.ReactNode;
}) => (
  <section aria-label={props.title} className="border-t border-rule">
    <h3 className="px-4 pt-3 pb-1 text-sm font-semibold sm:px-5">
      {props.title}{' '}
      <span className="font-normal text-muted-foreground tabular-nums">{props.count}</span>
    </h3>
    {props.items > 0 ? (
      props.children
    ) : (
      <p className="px-4 pt-1 pb-3 text-sm text-muted-foreground sm:px-5">{props.empty}</p>
    )}
  </section>
);

/**
 * What waits on the caller: their overdue tasks, the ones coming up, with the same controls as
 * the task list (complete from the box), and the leads whose follow-up is due (from their
 * reminders; `leads` is undefined when those could not be read).
 * @param props Component props.
 * @param props.workspace The workspace: its id, time zone and the caller's permissions.
 * @param props.me The caller's user id.
 * @param props.overdue The dashboard's `myOverdueTasks`.
 * @param props.upcoming The dashboard's `myUpcomingTasks`.
 * @param props.leads The reminders' `followUpLeads`.
 * @returns The panel.
 */
export const FollowUps = (props: {
  workspace: Pick<components['schemas']['WorkspaceResponse'], 'id' | 'timezone' | 'permissions'>;
  me: number;
  overdue: Task[];
  upcoming: Task[];
  leads?: BellReminders['followUpLeads'];
}) => {
  const t = useTranslations('FollowUps');
  const today = todayIn(props.workspace.timezone);
  // A full list may be a cut: the tasks' at 8 (the dashboard's), the leads' at 20 (the reminders').
  const count = (length: number, cap = CAP) =>
    length >= cap ? t('count_capped', { count: cap }) : t('count', { count: length });
  const tasks = (list: Task[]) => (
    <TaskTable
      tasks={list}
      workspaceId={props.workspace.id}
      permissions={props.workspace.permissions}
      me={props.me}
      timeZone={props.workspace.timezone}
      headingId={HEADING}
      compact
    />
  );

  return (
    <Panel id="follow-ups" title={t('title')}>
      <Group
        title={t('overdue')}
        items={props.overdue.length}
        count={count(props.overdue.length)}
        empty={t('overdue_none')}
      >
        {tasks(props.overdue)}
      </Group>
      <Group
        title={t('upcoming')}
        items={props.upcoming.length}
        count={count(props.upcoming.length)}
        empty={t('upcoming_none')}
      >
        {tasks(props.upcoming)}
      </Group>
      {props.leads ? (
        <Group
          title={t('leads')}
          items={props.leads.length}
          count={count(props.leads.length, REMINDER_CAP)}
          empty={t('leads_none')}
        >
          <ul>
            {props.leads.map((lead) => (
              <li
                key={lead.id}
                className="flex items-start justify-between gap-3 px-4 py-2 sm:px-5"
              >
                <span className="flex min-w-0 flex-col">
                  <Link
                    href={`/app/${props.workspace.id}/leads/${lead.id}`}
                    className="text-[0.9375rem] font-medium break-words text-foreground"
                  >
                    {fullName(lead)}
                  </Link>
                  <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                    {recordNumber('lead', lead.id)}
                  </span>
                </span>
                <span className="shrink-0 text-sm">
                  <LeadFollowUp date={lead.followUpDate} overdue={isFollowUpOverdue(lead, today)} />
                </span>
              </li>
            ))}
          </ul>
        </Group>
      ) : (
        <p className="border-t border-rule px-4 py-3 text-sm text-muted-foreground sm:px-5">
          {t('leads_unavailable')}
        </p>
      )}
      <div className="mt-auto border-t border-rule px-4 py-3 sm:px-5">
        <Link
          href={`/app/${props.workspace.id}/tasks?view=mine`}
          className="font-medium text-seal-ink"
        >
          {t('all_tasks')}
        </Link>
      </div>
    </Panel>
  );
};

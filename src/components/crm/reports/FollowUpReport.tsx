import { useTranslations } from 'next-intl';
import { Panel } from '@/components/crm/dashboard/Panel';
import { isFollowUpOverdue, LeadFollowUp } from '@/components/crm/lead/LeadFollowUp';
import { ReportMember } from '@/components/crm/reports/ReportMember';
import { TaskDue } from '@/components/crm/task/TaskRow';
import type { components } from '@/libs/api/schema';
import { fullName, recordNumber } from '@/libs/crm/Format';
import { Link } from '@/libs/I18nNavigation';

const LEADS_DUE = 'status=NEW&status=CONTACTED&status=QUALIFIED';

/**
 * One group: its title with the workspace's count, what it holds, its first items as the API
 * sent them, and "and N more" with a link to the list when the API cut the rest.
 * @param props Component props.
 * @param props.id The group's name, for its heading's id.
 * @param props.title The title.
 * @param props.hint What the group holds.
 * @param props.count How many there are in all.
 * @param props.shown How many of them are listed.
 * @param props.empty What it says with none.
 * @param props.moreHref The list of all of them.
 * @param props.children The items.
 * @returns The panel.
 */
const Group = (props: {
  id: string;
  title: string;
  hint: string;
  count: number;
  shown: number;
  empty: string;
  moreHref: string;
  children: React.ReactNode;
}) => {
  const t = useTranslations('FollowUpReport');

  return (
    <Panel
      id={props.id}
      title={props.title}
      aside={
        <span className="text-sm text-muted-foreground tabular-nums">
          {t('count', { count: props.count })}
        </span>
      }
    >
      <p className="px-4 pb-3 text-[0.8125rem] text-muted-foreground sm:px-5">{props.hint}</p>
      {props.shown > 0 ? (
        <ul className="border-t border-rule">{props.children}</ul>
      ) : (
        <p className="border-t border-rule px-4 py-6 text-muted-foreground sm:px-5">
          {props.empty}
        </p>
      )}
      {props.count > props.shown && (
        <div className="border-t border-rule px-4 py-3 sm:px-5">
          <Link href={props.moreHref} className="font-medium text-violet-ink">
            {t('more', { count: props.count - props.shown })}
          </Link>
        </div>
      )}
    </Panel>
  );
};

const ITEM = 'flex flex-col gap-1 border-b border-rule px-4 py-3 last:border-b-0 sm:px-5';
const TITLE = 'text-[0.9375rem] font-medium break-words text-foreground';
const META = 'flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.8125rem] text-muted-foreground';

/**
 * The follow-ups of the whole workspace, or of one member, as of now: the overdue tasks, the tasks
 * due in the next 7 days and the leads whose follow-up is due, each with its count and the first
 * items the API sent (a link to the record, its number, when it is due, who holds it), and a link
 * to the filtered list for the rest (the member's tasks or leads, for one member).
 * @param props Component props.
 * @param props.report The follow-ups report.
 * @param props.workspace The workspace: its id and time zone.
 * @param props.today Today in the workspace's time zone, `YYYY-MM-DD`.
 * @param props.owner The member whose tasks and leads it counts, when the page counts one member's.
 * @returns The three groups.
 */
export const FollowUpReport = (props: {
  report: components['schemas']['FollowUpReport'];
  workspace: Pick<components['schemas']['WorkspaceResponse'], 'id' | 'timezone'>;
  today: string;
  owner?: components['schemas']['MemberRef'];
}) => {
  const t = useTranslations('FollowUpReport');
  const base = `/app/${props.workspace.id}`;
  const name = props.owner && (props.owner.displayName ?? props.owner.email);
  // The lists of the rest, narrowed to the member's own.
  const assignee = props.owner ? `&assigneeId=${props.owner.userId}` : '';
  const owned = props.owner ? `&ownerId=${props.owner.userId}` : '';
  const { overdueTasks, upcomingTasks, dueLeads } = props.report;
  const tasks = (list: typeof overdueTasks) =>
    list.first.map((task) => (
      <li key={task.id} className={ITEM}>
        <Link href={`${base}/tasks/${task.id}`} className={TITLE}>
          {task.title}
        </Link>
        <span className={META}>
          <span className="font-mono tabular-nums">{recordNumber('task', task.id)}</span>
          <TaskDue dueAt={task.dueAt} overdue={task.overdue} timeZone={props.workspace.timezone} />
        </span>
        {/* Who holds it, under its title: secondary, never louder than the title. */}
        <span className="text-sm text-muted-foreground">
          <ReportMember member={task.assignee} none={t('unassigned')} />
        </span>
      </li>
    ));

  return (
    <div className="grid items-start gap-5 lg:grid-cols-3">
      <Group
        id="overdue"
        title={t('overdue')}
        hint={t('overdue_hint')}
        count={overdueTasks.count}
        shown={overdueTasks.first.length}
        empty={name ? t('overdue_none_owner', { name }) : t('overdue_none')}
        moreHref={`${base}/tasks?view=overdue${assignee}`}
      >
        {tasks(overdueTasks)}
      </Group>
      <Group
        id="upcoming"
        title={t('upcoming')}
        hint={t('upcoming_hint')}
        count={upcomingTasks.count}
        shown={upcomingTasks.first.length}
        empty={name ? t('upcoming_none_owner', { name }) : t('upcoming_none')}
        moreHref={`${base}/tasks?view=upcoming${assignee}`}
      >
        {tasks(upcomingTasks)}
      </Group>
      <Group
        id="due-leads"
        title={t('leads')}
        hint={t('leads_hint')}
        count={dueLeads.count}
        shown={dueLeads.first.length}
        empty={name ? t('leads_none_owner', { name }) : t('leads_none')}
        moreHref={`${base}/leads?${LEADS_DUE}&followUpBefore=${props.today}&sort=FOLLOW_UP_DATE&direction=ASC${owned}`}
      >
        {dueLeads.first.map((lead) => (
          <li key={lead.id} className={ITEM}>
            <Link href={`${base}/leads/${lead.id}`} className={TITLE}>
              {fullName(lead)}
            </Link>
            <span className={META}>
              <span className="font-mono tabular-nums">{recordNumber('lead', lead.id)}</span>
              <LeadFollowUp
                date={lead.followUpDate}
                overdue={isFollowUpOverdue(lead, props.today)}
              />
            </span>
            <span className="text-sm text-muted-foreground">
              <ReportMember member={lead.owner} none={t('unassigned')} />
            </span>
          </li>
        ))}
      </Group>
    </div>
  );
};

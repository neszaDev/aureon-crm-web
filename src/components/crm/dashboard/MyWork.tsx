import { useTranslations } from 'next-intl';
import { Panel } from '@/components/crm/dashboard/Panel';
import { isFollowUpOverdue, LeadFollowUp } from '@/components/crm/lead/LeadFollowUp';
import { StatusSection } from '@/components/crm/list/StatusSection';
import { SpaceChip } from '@/components/crm/shell/CrmNav';
import { StatusPill } from '@/components/crm/StatusPill';
import { TaskTable } from '@/components/crm/task/TaskTable';
import type { components } from '@/libs/api/schema';
import { fullName, recordNumber } from '@/libs/crm/Format';
import type { BellReminders } from '@/libs/crm/Reminders';
import { REMINDER_CAP } from '@/libs/crm/Reminders';
import type { DueBounds } from '@/libs/crm/TaskViews';
import { SECTION_TONES, sectionOf } from '@/libs/crm/TaskViews';
import { Link } from '@/libs/I18nNavigation';

type Task = components['schemas']['TaskResponse'];

// How many tasks the dashboard's read sends in each list (api.md): a full list may be a cut.
const CAP = 8;
const HEADING = 'my-work-heading';
const SECTIONS = ['overdue', 'today', 'week'] as const;

/**
 * What waits on the caller, as the Tasks page groups it: their overdue tasks, the ones due today
 * and in the next 7 days, each section headed by its pill and count, the rows with the task list's
 * box that completes one; then the leads whose follow-up is due (from their reminders; `leads` is
 * undefined when those could not be read). Tasks due later are on the Tasks page. A section the
 * API's cut may have shortened counts with a plus: the overdue list when it is full, and of the
 * upcoming one (soonest first) the section its last task falls in.
 * @param props Component props.
 * @param props.workspace The workspace: its id, time zone and the caller's permissions.
 * @param props.me The caller's user id.
 * @param props.overdue The dashboard's `myOverdueTasks`.
 * @param props.upcoming The dashboard's `myUpcomingTasks`.
 * @param props.leads The reminders' `followUpLeads`.
 * @param props.bounds Where today and the next 7 days part (`dueBounds`).
 * @param props.today Today in the workspace's time zone, `YYYY-MM-DD`.
 * @returns The panel.
 */
export const MyWork = (props: {
  workspace: Pick<components['schemas']['WorkspaceResponse'], 'id' | 'timezone' | 'permissions'>;
  me: number;
  overdue: Task[];
  upcoming: Task[];
  leads?: BellReminders['followUpLeads'];
  bounds: DueBounds;
  today: string;
}) => {
  const t = useTranslations('MyWork');
  const last = props.upcoming.at(-1);
  const cutAt = props.upcoming.length >= CAP && last ? sectionOf(last, props.bounds) : undefined;
  const sections = SECTIONS.map((key) => {
    const tasks =
      key === 'overdue'
        ? props.overdue
        : props.upcoming.filter((task) => sectionOf(task, props.bounds) === key);
    const capped = key === 'overdue' ? props.overdue.length >= CAP : cutAt === key;
    return { key, tasks, capped };
  }).filter((section) => section.tasks.length > 0);
  const count = (kind: 'tasks' | 'leads', length: number, capped: boolean) => ({
    count: capped ? `${length}+` : length,
    countLabel: t(capped ? `${kind}_count_capped` : `${kind}_count`, { count: length }),
  });

  return (
    <Panel
      id="my-work"
      title={t('title')}
      aside={
        <Link
          href={`/app/${props.workspace.id}/tasks?assigneeId=${props.me}`}
          className="text-[0.8125rem] font-medium text-violet-ink"
        >
          {t('all_tasks')}
        </Link>
      }
    >
      <div className="flex flex-col gap-2 px-4 pb-3 sm:px-5">
        {sections.map((section) => (
          <StatusSection
            key={section.key}
            title={
              <StatusPill
                tone={SECTION_TONES[section.key]}
                label={t(`section_${section.key}`)}
                field={t('due')}
              />
            }
            {...count('tasks', section.tasks.length, section.capped)}
          >
            <TaskTable
              tasks={section.tasks}
              workspaceId={props.workspace.id}
              permissions={props.workspace.permissions}
              me={props.me}
              timeZone={props.workspace.timezone}
              headingId={HEADING}
              bounds={props.bounds}
              compact
            />
          </StatusSection>
        ))}
        {sections.length === 0 && (
          <p className="py-2 text-sm text-muted-foreground">{t('tasks_none')}</p>
        )}
        {props.leads ? (
          props.leads.length > 0 && (
            <StatusSection
              title={
                <span className="flex min-w-0 items-center gap-2">
                  <SpaceChip space="leads" />
                  <span className="truncate">{t('leads')}</span>
                </span>
              }
              {...count('leads', props.leads.length, props.leads.length >= REMINDER_CAP)}
            >
              <ul>
                {props.leads.map((lead) => (
                  // Its name where a task's title starts, past the box a lead doesn't have.
                  <li
                    key={lead.id}
                    className="flex min-h-11 items-center justify-between gap-3 border-b border-rule py-1.5 pl-12 last:border-b-0"
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
                      <LeadFollowUp
                        date={lead.followUpDate}
                        overdue={isFollowUpOverdue(lead, props.today)}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </StatusSection>
          )
        ) : (
          <p className="py-2 text-sm text-muted-foreground">{t('leads_unavailable')}</p>
        )}
      </div>
    </Panel>
  );
};

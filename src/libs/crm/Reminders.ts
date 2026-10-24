import type { components } from '@/libs/api/schema';
import { toInstant } from '@/libs/crm/ZonedTime';

type Schemas = components['schemas'];
type Lists = { [List in keyof Schemas['RemindersResponse']]: readonly unknown[] };

/** What the bell shows of a task, and the version completing it needs. */
export type BellTask = Pick<
  Schemas['TaskResponse'],
  'id' | 'title' | 'version' | 'dueAt' | 'overdue'
>;

/** What the bell shows of a lead: its name, and what tells whether its follow-up is late. */
export type BellLead = Pick<
  Schemas['LeadResponse'],
  'id' | 'firstName' | 'lastName' | 'followUpDate' | 'status'
>;

/**
 * The reminders as the bell takes them, so full descriptions and notes don't ride every page, and
 * the workspace's day they were read on (`YYYY-MM-DD`), which tells a late follow-up.
 */
export type BellReminders = {
  overdueTasks: BellTask[];
  dueSoonTasks: BellTask[];
  followUpLeads: BellLead[];
  today: string;
};

// How many each reminder list holds at most (api.md, Tasks and reminders).
export const REMINDER_CAP = 20;

const listsOf = (reminders: Lists) => [
  reminders.overdueTasks,
  reminders.dueSoonTasks,
  reminders.followUpLeads,
];

/**
 * How many reminders there are: the overdue tasks, the tasks due in the next 24 hours and the
 * leads to follow up. Caps nothing; the API itself sends at most 20 of each.
 * @param reminders The caller's reminders.
 * @returns The count.
 */
export const reminderCount = (reminders: Lists) =>
  listsOf(reminders).reduce((total, list) => total + list.length, 0);

/**
 * The bell's badge: the count, with a plus when a list is at the cap, since the count is then a
 * lower bound.
 * @param reminders The caller's reminders.
 * @returns The badge text, e.g. `6` or `24+`.
 */
export const reminderBadge = (reminders: Lists) => {
  const capped = listsOf(reminders).some((list) => list.length >= REMINDER_CAP);

  return `${reminderCount(reminders)}${capped ? '+' : ''}`;
};

const slimTask = (task: Schemas['TaskResponse']): BellTask => ({
  id: task.id,
  title: task.title,
  version: task.version,
  dueAt: task.dueAt,
  overdue: task.overdue,
});

/**
 * Cuts the reminders down to what the bell shows.
 * @param reminders What `GET /reminders` sent.
 * @param today The workspace's day as they were read (`todayIn`).
 * @returns The same lists, each task and lead reduced to the bell's fields, and the day.
 */
export const slimReminders = (
  reminders: Schemas['RemindersResponse'],
  today: string,
): BellReminders => ({
  overdueTasks: reminders.overdueTasks.map(slimTask),
  dueSoonTasks: reminders.dueSoonTasks.map(slimTask),
  followUpLeads: reminders.followUpLeads.map((lead) => ({
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    followUpDate: lead.followUpDate,
    status: lead.status,
  })),
  today,
});

/** The inbox's groups, in order, each with its colour (the task lists' due colours). */
const INBOX_GROUPS = [
  { key: 'overdue', tone: 'red' },
  { key: 'today', tone: 'amber' },
  { key: 'upcoming', tone: 'blue' },
] as const;

/** One thing in the inbox: a task to do, or a lead to follow up. */
export type InboxItem = { task: BellTask } | { lead: BellLead };

const DAY = 24 * 60 * 60 * 1000;

/**
 * The reminders by when they are due, as the inbox groups them, on the workspace's day they were
 * read: overdue (the overdue tasks, then the leads whose follow-up day has passed), today (the
 * tasks due before the workspace's midnight, then the leads due today) and upcoming (the rest of
 * the next 24 hours). A list at the API's cap may hold more than it shows: past its last item, so
 * the group that item falls in is marked, and today too for the leads (their last group).
 * @param reminders The caller's reminders.
 * @param timeZone The workspace's time zone, where its midnight falls.
 * @returns The groups in `INBOX_GROUPS`' order: their items, and whether they may be a cut.
 */
export const inboxGroups = (reminders: BellReminders, timeZone: string) => {
  const next = new Date(Date.parse(`${reminders.today}T00:00:00Z`) + DAY)
    .toISOString()
    .slice(0, 10);
  // A real instant for any real day (a midnight the clocks skip moves forward by the gap).
  const midnight = toInstant(`${next}T00:00`, timeZone);
  const tomorrow = midnight ? Date.parse(midnight) : Number.POSITIVE_INFINITY;
  const isToday = (task?: BellTask) => !task?.dueAt || Date.parse(task.dueAt) < tomorrow;
  const isLate = (lead?: BellLead) =>
    lead?.followUpDate !== undefined && lead.followUpDate < reminders.today;
  const cut = (list: readonly unknown[]) => list.length >= REMINDER_CAP;
  const { dueSoonTasks, followUpLeads } = reminders;
  const tasks = (list: BellTask[]) => list.map((task): InboxItem => ({ task }));
  const leads = (list: BellLead[]) => list.map((lead): InboxItem => ({ lead }));
  const groups: Record<(typeof INBOX_GROUPS)[number]['key'], [InboxItem[], boolean]> = {
    overdue: [
      [...tasks(reminders.overdueTasks), ...leads(reminders.followUpLeads.filter(isLate))],
      cut(reminders.overdueTasks) || (cut(followUpLeads) && isLate(followUpLeads.at(-1))),
    ],
    today: [
      [
        ...tasks(reminders.dueSoonTasks.filter(isToday)),
        ...leads(reminders.followUpLeads.filter((lead) => !isLate(lead))),
      ],
      // Today is the leads' last group: whatever a cut list leaves out may fall in it.
      (cut(dueSoonTasks) && isToday(dueSoonTasks.at(-1))) || cut(followUpLeads),
    ],
    upcoming: [
      tasks(reminders.dueSoonTasks.filter((task) => !isToday(task))),
      cut(dueSoonTasks) && !isToday(dueSoonTasks.at(-1)),
    ],
  };

  return INBOX_GROUPS.map((group) => {
    const [items, capped] = groups[group.key];
    return { ...group, items, capped };
  });
};

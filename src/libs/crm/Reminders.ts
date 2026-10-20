import type { components } from '@/libs/api/schema';

type Schemas = components['schemas'];
type Lists = { [List in keyof Schemas['RemindersResponse']]: readonly unknown[] };

/** What the bell shows of a task, and the version completing it needs. */
export type BellTask = Pick<
  Schemas['TaskResponse'],
  'id' | 'title' | 'version' | 'dueAt' | 'overdue'
>;

/** What the bell shows of a lead: its name, and what tells whether its follow-up is late. */
type BellLead = Pick<
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
 * A list's count as shown. A list of 20 may be a cut of a longer one, so it reads "20+".
 * @param length How many the list holds.
 * @returns The count, e.g. `3` or `20+`.
 */
export const listCount = (length: number) =>
  length >= REMINDER_CAP ? `${REMINDER_CAP}+` : String(length);

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

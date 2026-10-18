import type { components } from '@/libs/api/schema';

type Lists = { [List in keyof components['schemas']['RemindersResponse']]: readonly unknown[] };

// How many each reminder list holds at most (api.md, Tasks and reminders).
const CAP = 20;

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
export const listCount = (length: number) => (length >= CAP ? `${CAP}+` : String(length));

/**
 * The bell's badge: the count, with a plus when a list is at the cap, since the count is then a
 * lower bound.
 * @param reminders The caller's reminders.
 * @returns The badge text, e.g. `6` or `24+`.
 */
export const reminderBadge = (reminders: Lists) => {
  const capped = listsOf(reminders).some((list) => list.length >= CAP);

  return `${reminderCount(reminders)}${capped ? '+' : ''}`;
};

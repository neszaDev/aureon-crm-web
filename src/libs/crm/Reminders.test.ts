import { describe, expect, it } from 'vitest';
import { listCount, reminderBadge, reminderCount } from './Reminders';

// Only how many of each there are matters to the count.
const some = (count: number) => Array.from({ length: count }, (_, id) => ({ id }));
const remindersOf = (overdue: number, dueSoon: number, followUp: number) => ({
  overdueTasks: some(overdue),
  dueSoonTasks: some(dueSoon),
  followUpLeads: some(followUp),
});

describe(reminderCount, () => {
  it('adds the overdue tasks, the tasks due soon and the leads to follow up', () => {
    expect(reminderCount(remindersOf(2, 3, 1))).toBe(6);
    expect(reminderCount(remindersOf(0, 0, 0))).toBe(0);
  });

  it('caps nothing: three full lists are sixty', () => {
    expect(reminderCount(remindersOf(20, 20, 20))).toBe(60);
  });
});

describe(listCount, () => {
  it('shows the number of a list that holds fewer than the API sends', () => {
    expect(listCount(0)).toBe('0');
    expect(listCount(19)).toBe('19');
  });

  it('shows "20+" for a list that holds as many as the API sends, which may be a cut', () => {
    expect(listCount(20)).toBe('20+');
  });
});

describe(reminderBadge, () => {
  it('is the count, without a plus while every list is whole', () => {
    expect(reminderBadge(remindersOf(2, 3, 1))).toBe('6');
  });

  it('is a lower bound with a plus when any list is at the API cap', () => {
    expect(reminderBadge(remindersOf(20, 3, 1))).toBe('24+');
    expect(reminderBadge(remindersOf(0, 0, 20))).toBe('20+');
  });
});

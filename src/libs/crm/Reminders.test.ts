import { describe, expect, it } from 'vitest';
import { listCount, reminderBadge, reminderCount, slimReminders } from './Reminders';

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

describe(slimReminders, () => {
  it('keeps what the bell shows and the version a completion needs, and nothing else, with the day they were read', () => {
    const task = {
      id: 42,
      title: 'Send the proposal',
      description: 'A long description that must not ride every page.',
      priority: 'HIGH',
      status: 'OPEN',
      dueAt: '2026-10-10T02:00:00Z',
      overdue: true,
      assignee: { userId: 1, email: 'mia@acme.test' },
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      version: 3,
    } as const;
    const lead = {
      id: 5,
      firstName: 'Noa',
      lastName: 'Park',
      companyName: 'Initech',
      email: 'noa@initech.test',
      notes: 'Private notes.',
      followUpDate: '2026-10-01',
      status: 'CONTACTED',
      priority: 'MEDIUM',
      archived: false,
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      version: 1,
    } as const;

    expect(
      slimReminders(
        { overdueTasks: [task], dueSoonTasks: [], followUpLeads: [lead] },
        '2026-10-20',
      ),
    ).toStrictEqual({
      overdueTasks: [
        {
          id: 42,
          title: 'Send the proposal',
          version: 3,
          dueAt: '2026-10-10T02:00:00Z',
          overdue: true,
        },
      ],
      dueSoonTasks: [],
      followUpLeads: [
        {
          id: 5,
          firstName: 'Noa',
          lastName: 'Park',
          followUpDate: '2026-10-01',
          status: 'CONTACTED',
        },
      ],
      today: '2026-10-20',
    });
  });
});

import { describe, expect, it } from 'vitest';
import { inboxGroups, reminderBadge, reminderCount, slimReminders } from './Reminders';

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

const bellTask = (id: number, dueAt: string, overdue = false) => ({
  id,
  title: `Task ${id}`,
  version: 1,
  dueAt,
  overdue,
});
const bellLead = (id: number, followUpDate: string) => ({
  id,
  firstName: 'Noa',
  lastName: `Park ${id}`,
  followUpDate,
  status: 'CONTACTED' as const,
});
// Each group as its key, its items (T for a task, L for a lead) and whether it may be a cut.
const ids = (groups: ReturnType<typeof inboxGroups>) =>
  groups.map((group) => [
    group.key,
    group.items.map((item) => ('task' in item ? `T${item.task.id}` : `L${item.lead.id}`)),
    group.capped,
  ]);

describe(inboxGroups, () => {
  // Read on 19 October in Bangkok, whose midnight is 17:00 UTC.
  const reminders = {
    overdueTasks: [bellTask(1, '2026-10-17T02:00:00Z', true)],
    dueSoonTasks: [bellTask(2, '2026-10-19T16:59:00Z'), bellTask(3, '2026-10-19T17:00:00Z')],
    followUpLeads: [bellLead(4, '2026-10-18'), bellLead(5, '2026-10-19')],
    today: '2026-10-19',
  };

  it("parts the reminders at the workspace's midnight, the late leads with the overdue tasks", () => {
    expect(ids(inboxGroups(reminders, 'Asia/Bangkok'))).toStrictEqual([
      ['overdue', ['T1', 'L4'], false],
      ['today', ['T2', 'L5'], false],
      ['upcoming', ['T3'], false],
    ]);
  });

  it("parts them at another zone's midnight", () => {
    // Midnight in Paris (UTC+2 in October) is 22:00 UTC: both tasks are due today there.
    expect(ids(inboxGroups(reminders, 'Europe/Paris'))[1]).toStrictEqual([
      'today',
      ['T2', 'T3', 'L5'],
      false,
    ]);
  });

  it('marks a group fed by a list at the cap as a possible cut', () => {
    const full = Array.from({ length: 20 }, (_, id) => bellTask(100 + id, '2026-10-19T03:00:00Z'));
    const groups = inboxGroups({ ...reminders, dueSoonTasks: full }, 'Asia/Bangkok');

    expect(groups.map((group) => group.capped)).toStrictEqual([false, true, true]);
  });
});

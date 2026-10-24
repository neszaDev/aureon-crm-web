import type { components, paths } from '@/libs/api/schema';
import { DUE_BUCKET_TONES } from '@/libs/crm/StatusColors';
import { toInstant, toLocalInput } from '@/libs/crm/ZonedTime';

type TaskQuery = NonNullable<
  paths['/api/v1/workspaces/{workspaceId}/tasks']['get']['parameters']['query']
>;

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

/**
 * The Tasks page's sections, in order: the open tasks by when they are due (overdue, today, from
 * tomorrow to a week from now, later, without a due time), then the completed and the cancelled
 * ones, folded.
 */
export const TASK_SECTIONS = [
  'overdue',
  'today',
  'week',
  'later',
  'undated',
  'completed',
  'cancelled',
] as const;

export type TaskSection = (typeof TASK_SECTIONS)[number];

/**
 * What the Tasks page's `view` takes: one section, or `upcoming` (today and the week: the open
 * tasks due from now to a week on, as the follow-up report counts them). `mine` and `all` were its
 * tabs; their old links are redirected (to "Me", and to the whole list).
 */
export const TASK_VIEWS = [...TASK_SECTIONS, 'upcoming', 'mine', 'all'] as const;

export type TaskView = (typeof TASK_VIEWS)[number];

/** Each section's colour: the due buckets' (`DUE_BUCKET_TONES`), completed green, cancelled slate. */
export const SECTION_TONES = {
  overdue: DUE_BUCKET_TONES.OVERDUE,
  today: DUE_BUCKET_TONES.TODAY,
  week: DUE_BUCKET_TONES.NEXT_7_DAYS,
  later: DUE_BUCKET_TONES.LATER,
  undated: DUE_BUCKET_TONES.NO_DATE,
  completed: 'green',
  cancelled: 'slate',
} as const;

/** Where the open sections part, as instants: now, the start of tomorrow, a week from now. */
export type DueBounds = { now: string; tomorrow: string; week: string };

/**
 * Where the open sections part at a time, in the workspace's time zone.
 * @param timeZone The workspace's time zone.
 * @param now The time, in milliseconds: now unless given.
 * @returns The bounds.
 */
export const dueBounds = (timeZone: string, now = Date.now()): DueBounds => {
  const today = toLocalInput(new Date(now).toISOString(), timeZone).slice(0, 10);
  const next = new Date(Date.parse(`${today}T00:00:00Z`) + DAY).toISOString().slice(0, 10);

  return {
    now: new Date(now).toISOString(),
    tomorrow: toInstant(`${next}T00:00`, timeZone) ?? new Date(now + DAY).toISOString(),
    week: new Date(now + WEEK).toISOString(),
  };
};

/**
 * What a view asks the task list for, besides the search, the assignee, the sort and the paging:
 * the open sections by their due times (`dueFrom` inclusive, `dueTo` exclusive), the closed ones
 * by their status, latest changed first unless the list is sorted. "Without a due time" asks for
 * every open task: `getUndatedTasks` reads the end of that list, where they come.
 * @param view The view; none for every task.
 * @param bounds Where the sections part.
 * @param sorted Whether the list has a sort of its own (the `sort` param).
 * @returns The backend's filters, and the closed sections' sort.
 */
export const viewQuery = (view: TaskView | undefined, bounds: DueBounds, sorted: boolean) => {
  const open = { status: ['OPEN'] } satisfies TaskQuery;
  const closed = sorted ? {} : ({ sort: 'UPDATED_AT', direction: 'DESC' } as const);
  const queries: Record<TaskView, TaskQuery> = {
    overdue: { ...open, dueTo: bounds.now },
    today: { ...open, dueFrom: bounds.now, dueTo: bounds.tomorrow },
    week: { ...open, dueFrom: bounds.tomorrow, dueTo: bounds.week },
    later: { ...open, dueFrom: bounds.week },
    undated: open,
    upcoming: { ...open, dueFrom: bounds.now, dueTo: bounds.week },
    completed: { status: ['COMPLETED'], ...closed },
    cancelled: { status: ['CANCELLED'], ...closed },
    mine: {},
    all: {},
  };

  return view ? queries[view] : {};
};

/**
 * The sections a view shows, grouped: every one, `upcoming`'s two, or the one it names.
 * @param view The view; none for every task.
 * @returns The sections, in order.
 */
export const sectionsOf = (view?: TaskView): TaskSection[] => {
  if (view === 'upcoming') {
    return ['today', 'week'];
  }
  const only = TASK_SECTIONS.find((section) => section === view);

  return only ? [only] : [...TASK_SECTIONS];
};

/**
 * The section a task falls in.
 * @param task The task's status and due time.
 * @param bounds Where the sections part.
 * @returns The section.
 */
export const sectionOf = (
  task: Pick<components['schemas']['TaskResponse'], 'status' | 'dueAt'>,
  bounds: DueBounds,
): TaskSection => {
  if (task.status !== 'OPEN') {
    return task.status === 'COMPLETED' ? 'completed' : 'cancelled';
  }
  if (!task.dueAt) {
    return 'undated';
  }
  const due = Date.parse(task.dueAt);
  if (due < Date.parse(bounds.now)) {
    return 'overdue';
  }
  if (due < Date.parse(bounds.tomorrow)) {
    return 'today';
  }

  return due < Date.parse(bounds.week) ? 'week' : 'later';
};

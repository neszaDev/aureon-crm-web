import type { components } from '@/libs/api/schema';
import type { Stage } from '@/libs/crm/Stages';

/** The status colours (`--status-<tone>` in global.css; `data-tone` applies one). */
export type StatusTone = 'blue' | 'teal' | 'violet' | 'amber' | 'green' | 'red' | 'slate';

/**
 * A status pill's look (`StatusPill`) on an element with `data-tone`, for what draws one without
 * the component: a board column's heading, the sign-in page's sample. Here, not in the component,
 * so a server-drawn page can use it without the pill's menu code.
 */
export const PILL =
  'inline-flex h-6 max-w-full min-w-0 items-center gap-1.5 rounded-full border border-transparent bg-(--tone-tint) px-2.5 text-xs font-semibold whitespace-nowrap text-(--tone-ink)';

/** A lead's status walks blue → violet → amber to converted green; unqualified rests in slate. */
export const LEAD_STATUS_TONES: Record<
  components['schemas']['LeadResponse']['status'],
  StatusTone
> = {
  NEW: 'blue',
  CONTACTED: 'violet',
  QUALIFIED: 'amber',
  CONVERTED: 'green',
  UNQUALIFIED: 'slate',
};

/** A task is open in blue, completed in green, cancelled in slate. */
export const TASK_STATUS_TONES: Record<
  components['schemas']['TaskResponse']['status'],
  StatusTone
> = {
  OPEN: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'slate',
};

/** Where a task's due date falls, as the task lists group it: overdue is red, today amber, the
 * coming week blue, later violet, no date slate. */
export const DUE_BUCKET_TONES: Record<
  'OVERDUE' | 'TODAY' | 'NEXT_7_DAYS' | 'LATER' | 'NO_DATE',
  StatusTone
> = {
  OVERDUE: 'red',
  TODAY: 'amber',
  NEXT_7_DAYS: 'blue',
  LATER: 'violet',
  NO_DATE: 'slate',
};

/** Leads' and tasks' priorities: high red, medium amber, low slate. */
export const PRIORITY_TONES: Record<components['schemas']['TaskResponse']['priority'], StatusTone> =
  {
    HIGH: 'red',
    MEDIUM: 'amber',
    LOW: 'slate',
  };

const OPEN_WALK: StatusTone[] = ['blue', 'teal', 'violet', 'amber'];

/**
 * A deal stage's tone by its place in the pipeline: up to four open stages spread over the walk
 * blue → teal → violet → amber (the first blue, the last amber), more cycle through it, so
 * neighbouring open stages never share a tone; won is green and lost red.
 * @param stages The workspace's stages, in pipeline order.
 * @param id The stage.
 * @returns Its tone; slate for a stage the list doesn't hold.
 */
export const stageTone = (stages: readonly Pick<Stage, 'id' | 'kind'>[], id: number) => {
  const kind = stages.find((stage) => stage.id === id)?.kind;
  if (kind === 'WON') {
    return 'green';
  }
  if (kind === 'LOST') {
    return 'red';
  }
  const open = stages.filter((stage) => stage.kind === 'OPEN');
  const index = open.findIndex((stage) => stage.id === id);
  if (index === -1) {
    return 'slate';
  }
  // A step of 1 or more keeps neighbours apart; past four stages the step is 1 and the walk cycles.
  const step =
    open.length > OPEN_WALK.length ? 1 : (OPEN_WALK.length - 1) / Math.max(open.length - 1, 1);

  return OPEN_WALK[Math.round(index * step) % OPEN_WALK.length] ?? 'slate';
};

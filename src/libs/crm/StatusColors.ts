import type { components } from '@/libs/api/schema';
import type { Stage } from '@/libs/crm/Stages';

/** The status colours (`--status-<tone>` in global.css; `data-tone` applies one). */
export type StatusTone = 'blue' | 'violet' | 'amber' | 'green' | 'red' | 'slate';

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

const OPEN_WALK: StatusTone[] = ['blue', 'violet', 'amber'];

/**
 * A deal stage's tone by its place in the pipeline: the open stages walk from blue (the first)
 * through violet to amber (the last), won is green and lost red.
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

  return OPEN_WALK[open.length === 1 ? 0 : Math.round((index * 2) / (open.length - 1))] ?? 'slate';
};

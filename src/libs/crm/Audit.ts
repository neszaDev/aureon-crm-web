import type { components } from '@/libs/api/schema';
import type { ListSpec } from './ListQuery';

type EntityType = components['schemas']['AuditEventResponse']['entityType'];

/** The kinds of record the audit trail names (api.md, Audit), in the order its filter lists them. */
export const AUDIT_ENTITY_TYPES = [
  'COMPANY',
  'CONTACT',
  'LEAD',
  'DEAL',
  'TASK',
  'ACTIVITY',
  'MEMBER',
  'INVITATION',
  'PIPELINE_STAGE',
  'LEAD_SOURCE',
  'WORKSPACE',
] as const satisfies readonly EntityType[];

/** The records that show their own history, which any member may read (api.md, Audit). */
export const HISTORY_TYPES = ['COMPANY', 'CONTACT', 'LEAD', 'DEAL', 'TASK'] as const;

/** How many events a record's history shows at a time. */
export const HISTORY_PAGE_SIZE = 10;

/**
 * The audit trail page's URL state (api.md, Audit): the kind of record and who did it, with the
 * paging. The events come newest first, whatever the sort: the one it lists is the page's own.
 */
export const AUDIT_LIST = {
  sorts: ['OCCURRED_AT'],
  defaultSort: 'OCCURRED_AT',
  filters: { entityType: { enum: AUDIT_ENTITY_TYPES }, actorId: 'id' },
} as const satisfies ListSpec;

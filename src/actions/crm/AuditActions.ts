'use server';

import { getAuditEvents } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import { redirectIfUnauthorized } from '@/libs/api/Session';
import { HISTORY_PAGE_SIZE, HISTORY_TYPES } from '@/libs/crm/Audit';
import { toRecordId } from '@/libs/crm/WorkspaceId';

type AuditEvent = components['schemas']['AuditEventResponse'];
type HistoryType = (typeof HISTORY_TYPES)[number];

/**
 * Loads a later page of a record's history, for "Show older". A 401 ends the session.
 * @param workspaceId The workspace.
 * @param entityType The kind of record.
 * @param entityId The record.
 * @param page The page, from 1 (the record's page holds the first).
 * @returns The page's events, newest first.
 * @throws {Error} When the record or page isn't one, or the backend refuses.
 */
export async function loadHistory(
  workspaceId: number,
  entityType: HistoryType,
  entityId: number,
  page: number,
): Promise<AuditEvent[]> {
  // A server action takes whatever a caller sends.
  if (
    !HISTORY_TYPES.some((type) => type === entityType) ||
    toRecordId(String(entityId)) === undefined ||
    !Number.isSafeInteger(page) ||
    page < 0
  ) {
    throw new Error('Not a history page');
  }
  const result = await getAuditEvents(String(workspaceId), {
    entityType,
    entityId,
    page,
    size: HISTORY_PAGE_SIZE,
  });
  if (result.unauthorized) {
    await redirectIfUnauthorized(401);
  }
  if (!result.events) {
    throw new Error('The history could not be loaded');
  }

  return result.events.content;
}

'use server';

import type { RecordKind, RecordOption } from '@/libs/api/RecordSearch';
import { findRecords } from '@/libs/api/RecordSearch';

export type { RecordKind, RecordOption } from '@/libs/api/RecordSearch';

/**
 * Finds active records of a kind whose list search (`q`) matches the text, for `RecordPicker`.
 * A 401 ends the session, as on any page; any other refusal throws, so the picker says the search
 * failed rather than that nothing matches.
 * @param workspaceId The workspace.
 * @param kind The kind of record.
 * @param q The text typed so far; blank lists the first records.
 * @returns Up to 10 records.
 * @throws {Error} When the backend refuses the search (any status but 401, which redirects).
 */
export async function searchRecords(
  workspaceId: number,
  kind: RecordKind,
  q: string,
): Promise<RecordOption[]> {
  return await findRecords(workspaceId, kind, q, 10);
}

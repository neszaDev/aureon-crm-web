'use server';

import { authedBackend } from '@/libs/api/Backend';

/** A record a picker offers: its name, and a detail that tells look-alikes apart. */
export type RecordOption = { id: number; label: string; detail?: string };

type Api = Awaited<ReturnType<typeof authedBackend>>;

// How each kind is searched: its list endpoint, active records only (the default), the first 10
// matching `q`. A kind lands here with the first picker that needs it.
const SEARCHES = {
  company: async (api: Api, workspaceId: number, q?: string): Promise<RecordOption[]> => {
    const { data } = await api.GET('/api/v1/workspaces/{workspaceId}/companies', {
      params: { path: { workspaceId }, query: { q, size: 10 } },
    });
    return (data?.content ?? []).map((company) => ({
      id: company.id,
      label: company.name,
      detail: company.website,
    }));
  },
};

/** The kinds of record a picker can link. */
export type RecordKind = keyof typeof SEARCHES;

/**
 * Finds active records of a kind whose list search (`q`) matches the text, for `RecordPicker`.
 * A hint only: any failure finds none.
 * @param workspaceId The workspace.
 * @param kind The kind of record.
 * @param q The text typed so far; blank lists the first records.
 * @returns Up to 10 records.
 */
export async function searchRecords(
  workspaceId: number,
  kind: RecordKind,
  q: string,
): Promise<RecordOption[]> {
  // A server action takes whatever a caller sends.
  if (!Object.hasOwn(SEARCHES, kind)) {
    return [];
  }
  // As the list parser: no NUL (a 400), and at most the 200 characters `q` takes.
  const text = q.replaceAll('\u0000', '').trim().slice(0, 200);

  return await SEARCHES[kind](await authedBackend(), workspaceId, text || undefined);
}

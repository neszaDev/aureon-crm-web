'use server';

import { findRecords, searchText } from '@/libs/api/RecordSearch';
import type { RecordKind, RecordOption } from '@/libs/api/RecordSearch';
import { recordNumber } from '@/libs/crm/Format';

/** A search result: the record, its number, and where its page is (`/app/…`, as `Link` takes). */
export type Hit = RecordOption & { href: string; reference: string };

export type SearchGroups = { companies: Hit[]; contacts: Hit[]; leads: Hit[]; deals: Hit[] };

// Each group: the kind it finds and the path of its pages.
const GROUPS = {
  companies: { kind: 'company', path: 'companies' },
  contacts: { kind: 'contact', path: 'contacts' },
  leads: { kind: 'lead', path: 'leads' },
  deals: { kind: 'deal', path: 'deals' },
} as const satisfies Record<keyof SearchGroups, { kind: RecordKind; path: string }>;

/**
 * Finds the active companies, contacts, leads and deals matching the text, 5 of each, for the
 * record search. A 401 ends the session, as on any page; any other refusal throws, so the search
 * says it failed rather than that nothing matches.
 * @param workspaceId The workspace.
 * @param q The text typed so far; under 2 characters (trimmed) finds nothing and asks nobody.
 * @returns The records by kind.
 * @throws {Error} When the backend refuses a search (any status but 401, which redirects).
 */
export async function searchAll(workspaceId: number, q: string): Promise<SearchGroups> {
  if (searchText(q).length < 2) {
    return { companies: [], contacts: [], leads: [], deals: [] };
  }
  const [companies = [], contacts = [], leads = [], deals = []] = await Promise.all(
    Object.values(GROUPS).map(async ({ kind, path }) => {
      const records = await findRecords(workspaceId, kind, q, 5);

      return records.map((record) => ({
        ...record,
        href: `/app/${workspaceId}/${path}/${record.id}`,
        reference: recordNumber(kind, record.id),
      }));
    }),
  );

  return { companies, contacts, leads, deals };
}

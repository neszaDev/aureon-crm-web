import 'server-only';
import { authedBackend } from '@/libs/api/Backend';
import { redirectIfUnauthorized } from '@/libs/api/Session';

/** A record a picker offers: its name, and a detail that tells look-alikes apart. */
export type RecordOption = { id: number; label: string; detail?: string };

type Api = Awaited<ReturnType<typeof authedBackend>>;

// How each kind is searched: its list endpoint, active records only (the default), the first
// `size` matching `q`. The options are undefined when the backend refused. A kind lands here
// with the first picker that needs it.
const SEARCHES = {
  company: async (api: Api, workspaceId: number, q: string | undefined, size: number) => {
    const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/companies', {
      params: { path: { workspaceId }, query: { q, size } },
    });
    const options: RecordOption[] | undefined = data?.content.map((company) => ({
      id: company.id,
      label: company.name,
      detail: company.website,
    }));
    return { status: response.status, options };
  },
  contact: async (api: Api, workspaceId: number, q: string | undefined, size: number) => {
    const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/contacts', {
      params: { path: { workspaceId }, query: { q, size } },
    });
    const options: RecordOption[] | undefined = data?.content.map((contact) => ({
      id: contact.id,
      label: contact.fullName,
      detail: contact.company?.name ?? contact.email,
    }));
    return { status: response.status, options };
  },
  lead: async (api: Api, workspaceId: number, q: string | undefined, size: number) => {
    const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/leads', {
      params: { path: { workspaceId }, query: { q, size } },
    });
    const options: RecordOption[] | undefined = data?.content.map((lead) => ({
      id: lead.id,
      label: [lead.firstName, lead.lastName].filter(Boolean).join(' '),
      detail: lead.companyName,
    }));
    return { status: response.status, options };
  },
  deal: async (api: Api, workspaceId: number, q: string | undefined, size: number) => {
    const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/deals', {
      params: { path: { workspaceId }, query: { q, size } },
    });
    const options: RecordOption[] | undefined = data?.content.map((deal) => ({
      id: deal.id,
      label: deal.name,
      detail: deal.company?.name,
    }));
    return { status: response.status, options };
  },
};

/** The kinds of record a picker or the search can find. */
export type RecordKind = keyof typeof SEARCHES;

/**
 * Search text as the list parser takes it: no NUL (a 400), trimmed, and at most the 200
 * characters `q` takes.
 * @param q What was typed.
 * @returns The text to search for.
 */
export const searchText = (q: string) => q.replaceAll('\u0000', '').trim().slice(0, 200);

/**
 * Finds the first active records of a kind whose list search (`q`) matches the text. A 401 ends
 * the session, as on any page; any other refusal throws, so the caller says the search failed
 * rather than that nothing matches.
 * @param workspaceId The workspace.
 * @param kind The kind of record.
 * @param q The text typed so far; blank lists the first records.
 * @param size How many records to take.
 * @returns Up to `size` records.
 * @throws {Error} When the backend refuses the search (any status but 401, which redirects).
 */
export const findRecords = async (
  workspaceId: number,
  kind: RecordKind,
  q: string,
  size: number,
): Promise<RecordOption[]> => {
  // A server action takes whatever a caller sends.
  if (!Object.hasOwn(SEARCHES, kind)) {
    return [];
  }
  const { status, options } = await SEARCHES[kind](
    await authedBackend(),
    workspaceId,
    searchText(q) || undefined,
    size,
  );
  await redirectIfUnauthorized(status);
  if (!options) {
    throw new Error(`The ${kind} search failed (${status})`);
  }

  return options;
};

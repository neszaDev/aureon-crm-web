import 'server-only';
import { cache } from 'react';
import type { ListQuery, ListSpec } from '@/libs/crm/ListQuery';
import { PAGE_SIZES, parseListQuery } from '@/libs/crm/ListQuery';
import type { PeriodQuery } from '@/libs/crm/PeriodQuery';
import { toRecordId, toWorkspaceId } from '@/libs/crm/WorkspaceId';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';
import { DEAL_STATUSES, DEAL_VIEWS } from '@/validations/crm/DealValidation';
import { LEAD_PRIORITIES, LEAD_STATUSES } from '@/validations/crm/LeadValidation';
import { authedBackend, backend } from './Backend';
import type { paths } from './schema';

/** What the task list takes (api.md, Tasks and reminders): the backend's own query params. */
export type TaskQuery = NonNullable<
  paths['/api/v1/workspaces/{workspaceId}/tasks']['get']['parameters']['query']
>;

/** What the audit trail takes (api.md, Audit): the backend's own query params. */
export type AuditQuery = NonNullable<
  paths['/api/v1/workspaces/{workspaceId}/audit-events']['get']['parameters']['query']
>;

// Read-side CRM calls for server components, like `Queries.ts`. Each returns the data plus
// `unauthorized` (401: the session is gone), `forbidden` (403), `notFound` (404: unknown,
// or not a member: the backend answers both alike) and `invalid` (400: a list's query it
// refuses). Anything else leaves the data undefined.

const NOT_FOUND = {
  unauthorized: false,
  forbidden: false,
  notFound: true,
  invalid: false,
} as const;

/**
 * Reads the outcome flags of a backend response.
 * @param status HTTP status.
 * @returns The flags.
 */
const flags = (status: number) => ({
  unauthorized: status === 401,
  forbidden: status === 403,
  notFound: status === 404,
  invalid: status === 400,
});

/**
 * A list query as its endpoint's params: the filters are already named as the backend names them.
 * @param query The list query.
 * @returns The query params.
 */
const listParams = <S extends ListSpec>(query: ListQuery<S>) => ({
  ...query.filters,
  q: query.q,
  archived: query.archived,
  unassigned: query.unassigned,
  page: query.page,
  size: query.size,
  sort: query.sort,
  direction: query.direction,
});

/** The company list's sorts and filters (api.md, Companies). */
export const COMPANY_LIST = {
  sorts: ['NAME', 'CREATED_AT', 'UPDATED_AT'],
  defaultSort: 'NAME',
  filters: { ownerId: 'id', industry: 'text' },
} as const satisfies ListSpec;

/** The contact list's sorts and filters (api.md, Contacts). */
export const CONTACT_LIST = {
  sorts: ['NAME', 'COMPANY', 'CREATED_AT', 'UPDATED_AT'],
  defaultSort: 'NAME',
  filters: { companyId: 'id', ownerId: 'id', sourceId: 'id', tag: 'text' },
} as const satisfies ListSpec;

/** The lead list's sorts and filters (api.md, Leads): several statuses, `followUpBefore` inclusive. */
export const LEAD_LIST = {
  sorts: ['CREATED_AT', 'UPDATED_AT', 'FOLLOW_UP_DATE', 'PRIORITY', 'NAME'],
  defaultSort: 'CREATED_AT',
  filters: {
    status: { enum: LEAD_STATUSES, multiple: true },
    ownerId: 'id',
    sourceId: 'id',
    priority: { enum: LEAD_PRIORITIES },
    followUpBefore: 'date',
  },
} as const satisfies ListSpec;

/**
 * The deals page's URL state (api.md, Deals): the view, which the board and the table share with
 * the search, the owner and the company; the rest are the table's. `view` is the page's own, not
 * the backend's.
 */
export const DEAL_LIST = {
  sorts: ['UPDATED_AT', 'NAME', 'AMOUNT', 'EXPECTED_CLOSE_DATE', 'CREATED_AT'],
  defaultSort: 'UPDATED_AT',
  filters: {
    view: { enum: DEAL_VIEWS },
    stageId: 'id',
    status: { enum: DEAL_STATUSES },
    ownerId: 'id',
    companyId: 'id',
    contactId: 'id',
    sourceId: 'id',
    closeFrom: 'date',
    closeTo: 'date',
  },
} as const satisfies ListSpec;

/** The Tasks page's views, its tabs: each a set of the task list's filters and a sort. */
export const TASK_VIEWS = ['mine', 'overdue', 'upcoming', 'completed', 'all'] as const;

export type TaskView = (typeof TASK_VIEWS)[number];

const WEEK = 7 * 24 * 60 * 60 * 1000;

// What each view asks the task list for. Due times run from `dueFrom` (inclusive) to `dueTo`
// (exclusive).
const VIEWS: Record<TaskView, (now: number) => TaskQuery> = {
  mine: () => ({ mine: true, status: ['OPEN'] }),
  overdue: () => ({ overdue: true }),
  upcoming: (now) => ({
    status: ['OPEN'],
    dueFrom: new Date(now).toISOString(),
    dueTo: new Date(now + WEEK).toISOString(),
  }),
  completed: () => ({ status: ['COMPLETED'], sort: 'UPDATED_AT', direction: 'DESC' }),
  all: () => ({}),
};

/**
 * What a Tasks page view asks the task list for, besides the search, the assignee and the paging.
 * @param view The view.
 * @param now The current time, in milliseconds.
 * @returns The backend's filters and sort for it.
 */
export const taskViewQuery = (view: TaskView, now: number) => VIEWS[view](now);

/**
 * The Tasks page's URL state: its view, the assignee filter (`unassigned` too) and the paging.
 * The view sets the backend's filters and sort (`getTasks` takes them as the backend names them).
 */
export const TASK_LIST = {
  sorts: ['DUE_AT'],
  defaultSort: 'DUE_AT',
  filters: { view: { enum: TASK_VIEWS }, assigneeId: 'id' },
} as const satisfies ListSpec;

/**
 * Loads the signed-in user's workspaces (`GET /workspaces`), by name.
 * @returns The workspaces (id, name, role) and the outcome flags.
 */
export const getMyWorkspaces = async () => {
  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces');

  return { workspaces: data, ...flags(response.status) };
};

/**
 * Loads one workspace with the caller's role and permissions (`GET /workspaces/{id}`). Cached
 * for the request, so the shell and the page share one call.
 * @param segment The `[workspaceId]` route segment.
 * @returns The workspace and the outcome flags.
 */
export const getWorkspace = cache(async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { workspace: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}', {
    params: { path: { workspaceId } },
  });

  return { workspace: data, ...flags(response.status) };
});

/**
 * Loads the members of a workspace (`GET /workspaces/{id}/members`). Cached for the request, so
 * a page and its metadata share one call.
 * @param segment The `[workspaceId]` route segment.
 * @returns The members and the outcome flags.
 */
export const getMembers = cache(async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { members: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/members', {
    params: { path: { workspaceId } },
  });

  return { members: data, ...flags(response.status) };
});

/**
 * Loads the pending invitations, newest first (`GET /workspaces/{id}/invitations`, needs
 * `MEMBERS_MANAGE`).
 * @param segment The `[workspaceId]` route segment.
 * @returns The invitations and the outcome flags.
 */
export const getInvitations = async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { invitations: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/invitations', {
    params: { path: { workspaceId } },
  });

  return { invitations: data, ...flags(response.status) };
};

/**
 * Loads the pipeline stages by position: the open ones, then Won and Lost
 * (`GET /workspaces/{id}/pipeline-stages`). Cached for the request.
 * @param segment The `[workspaceId]` route segment.
 * @returns The stages and the outcome flags.
 */
export const getStages = cache(async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { stages: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/pipeline-stages', {
    params: { path: { workspaceId } },
  });

  return { stages: data, ...flags(response.status) };
});

/**
 * Loads every lead source, archived ones included (`GET /workspaces/{id}/lead-sources`). Cached
 * for the request.
 * @param segment The `[workspaceId]` route segment.
 * @returns The sources and the outcome flags.
 */
export const getLeadSources = cache(async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { sources: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/lead-sources', {
    params: { path: { workspaceId }, query: { includeArchived: true } },
  });

  return { sources: data, ...flags(response.status) };
});

/**
 * Loads a page of the workspace's companies (`GET /workspaces/{id}/companies`).
 * @param segment The `[workspaceId]` route segment.
 * @param query The list query, read with `COMPANY_LIST`.
 * @returns The page and the outcome flags (`invalid`: the backend refused the query).
 */
export const getCompanies = async (segment: string, query: ListQuery<typeof COMPANY_LIST>) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { companies: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/companies', {
    params: { path: { workspaceId }, query: listParams(query) },
  });

  return { companies: data, ...flags(response.status) };
};

/**
 * Loads one company (`GET /workspaces/{id}/companies/{id}`). Cached for the request, so the page
 * and its metadata share one call.
 * @param segment The `[workspaceId]` route segment.
 * @param id The `[id]` route segment.
 * @returns The company and the outcome flags (`notFound` for a malformed id too).
 */
export const getCompany = cache(async (segment: string, id: string) => {
  const workspaceId = toWorkspaceId(segment);
  const companyId = toRecordId(id);
  if (workspaceId === undefined || companyId === undefined) {
    return { company: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/companies/{id}', {
    params: { path: { workspaceId, id: companyId } },
  });

  return { company: data, ...flags(response.status) };
});

/**
 * Loads a page of the workspace's contacts (`GET /workspaces/{id}/contacts`).
 * @param segment The `[workspaceId]` route segment.
 * @param query The list query, read with `CONTACT_LIST`.
 * @returns The page and the outcome flags (`invalid`: the backend refused the query).
 */
export const getContacts = async (segment: string, query: ListQuery<typeof CONTACT_LIST>) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { contacts: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/contacts', {
    params: { path: { workspaceId }, query: listParams(query) },
  });

  return { contacts: data, ...flags(response.status) };
};

/**
 * Loads one contact (`GET /workspaces/{id}/contacts/{id}`). Cached for the request, so the page
 * and its metadata share one call.
 * @param segment The `[workspaceId]` route segment.
 * @param id The `[id]` route segment.
 * @returns The contact and the outcome flags (`notFound` for a malformed id too).
 */
export const getContact = cache(async (segment: string, id: string) => {
  const workspaceId = toWorkspaceId(segment);
  const contactId = toRecordId(id);
  if (workspaceId === undefined || contactId === undefined) {
    return { contact: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/contacts/{id}', {
    params: { path: { workspaceId, id: contactId } },
  });

  return { contact: data, ...flags(response.status) };
});

/**
 * Loads a page of the workspace's leads, in full (`GET /workspaces/{id}/leads`).
 * @param segment The `[workspaceId]` route segment.
 * @param query The list query, read with `LEAD_LIST`.
 * @returns The page and the outcome flags (`invalid`: the backend refused the query).
 */
export const getLeads = async (segment: string, query: ListQuery<typeof LEAD_LIST>) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { leads: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/leads', {
    params: { path: { workspaceId }, query: listParams(query) },
  });

  return { leads: data, ...flags(response.status) };
};

/**
 * Loads one lead (`GET /workspaces/{id}/leads/{id}`). Cached for the request, so the page and
 * its metadata share one call.
 * @param segment The `[workspaceId]` route segment.
 * @param id The `[id]` route segment.
 * @returns The lead and the outcome flags (`notFound` for a malformed id too).
 */
export const getLead = cache(async (segment: string, id: string) => {
  const workspaceId = toWorkspaceId(segment);
  const leadId = toRecordId(id);
  if (workspaceId === undefined || leadId === undefined) {
    return { lead: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/leads/{id}', {
    params: { path: { workspaceId, id: leadId } },
  });

  return { lead: data, ...flags(response.status) };
});

/**
 * Loads a page of the workspace's deals (`GET /workspaces/{id}/deals`).
 * @param segment The `[workspaceId]` route segment.
 * @param query The list query, read with `DEAL_LIST`.
 * @returns The page and the outcome flags (`invalid`: the backend refused the query).
 */
export const getDeals = async (segment: string, query: ListQuery<typeof DEAL_LIST>) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { deals: undefined, ...NOT_FOUND };
  }

  // Not `view`, which only the page reads.
  const { stageId, status, ownerId, companyId, contactId, sourceId, closeFrom, closeTo } =
    query.filters;
  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/deals', {
    params: {
      path: { workspaceId },
      query: {
        stageId,
        status,
        ownerId,
        companyId,
        contactId,
        sourceId,
        closeFrom,
        closeTo,
        q: query.q,
        archived: query.archived,
        unassigned: query.unassigned,
        page: query.page,
        size: query.size,
        sort: query.sort,
        direction: query.direction,
      },
    },
  });

  return { deals: data, ...flags(response.status) };
};

/**
 * Loads the first 10 active deals of a company or a contact, most recently updated first, for
 * its page.
 * @param segment The `[workspaceId]` route segment.
 * @param param The link: `companyId` or `contactId`.
 * @param id The `[id]` route segment of the company or contact (a malformed one finds none).
 * @returns The page and the outcome flags.
 */
export const getDealsOf = async (segment: string, param: 'companyId' | 'contactId', id: string) => {
  const query = { ...parseListQuery(DEAL_LIST, { [param]: id }), size: 10 };

  // Without a valid id the query would list every deal.
  return query.filters[param] === undefined
    ? { deals: undefined, ...NOT_FOUND }
    : await getDeals(segment, query);
};

/**
 * Loads what a company's page lists besides its details: its first 10 active contacts by name and
 * its first 10 active deals, most recently updated first.
 * @param segment The `[workspaceId]` route segment.
 * @param id The `[id]` route segment (a malformed id finds none).
 * @returns The two pages and `unauthorized` (either 401).
 */
export const getCompanyLinks = async (segment: string, id: string) => {
  const contactsQuery = { ...parseListQuery(CONTACT_LIST, { companyId: id }), size: 10 };
  const [contacts, deals] = await Promise.all([
    // Without a valid id the query would list every contact.
    contactsQuery.filters.companyId === undefined ? undefined : getContacts(segment, contactsQuery),
    getDealsOf(segment, 'companyId', id),
  ]);

  return {
    contacts: contacts?.contacts,
    deals: deals.deals,
    unauthorized: contacts?.unauthorized === true || deals.unauthorized,
  };
};

/**
 * Looks up the company and contact a new deal is linked to from the page it was opened on
 * (`?companyId=`, `?contactId=`): each as a picker's record. A contact brings its company along
 * when none was named; an unknown or malformed record is left out rather than refused.
 * @param segment The `[workspaceId]` route segment.
 * @param params The page's `companyId` and `contactId` search params.
 * @returns The records the form starts with, and `unauthorized` (a lookup 401).
 */
export const getDealPrefill = async (
  segment: string,
  params: { companyId?: string | string[]; contactId?: string | string[] },
) => {
  const [companyId, contactId] = [params.companyId, params.contactId].map((value) =>
    typeof value === 'string' ? toRecordId(value) : undefined,
  );
  const [company, contact] = await Promise.all([
    companyId === undefined ? undefined : getCompany(segment, String(companyId)),
    contactId === undefined ? undefined : getContact(segment, String(contactId)),
  ]);
  const companyRef = company?.company ?? contact?.contact?.company;

  return {
    company: companyRef ? { id: companyRef.id, label: companyRef.name } : null,
    contact: contact?.contact ? { id: contact.contact.id, label: contact.contact.fullName } : null,
    unauthorized: company?.unauthorized === true || contact?.unauthorized === true,
  };
};

/**
 * Loads the deal board (`GET /workspaces/{id}/deals/board`): every stage in order with its
 * count, its totals per currency and up to 50 active deals, most recently updated first.
 * @param segment The `[workspaceId]` route segment.
 * @param query The list query, read with `DEAL_LIST`: the board takes the search, the owner
 *   (Unassigned too) and the company.
 * @returns The columns and the outcome flags (`invalid`: the backend refused the query).
 */
export const getBoard = async (segment: string, query: ListQuery<typeof DEAL_LIST>) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { board: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/deals/board', {
    params: {
      path: { workspaceId },
      query: {
        q: query.q,
        ownerId: query.filters.ownerId,
        unassigned: query.unassigned,
        companyId: query.filters.companyId,
      },
    },
  });

  return { board: data, ...flags(response.status) };
};

/**
 * Loads one deal (`GET /workspaces/{id}/deals/{id}`). Cached for the request, so the page and
 * its metadata share one call.
 * @param segment The `[workspaceId]` route segment.
 * @param id The `[id]` route segment.
 * @returns The deal and the outcome flags (`notFound` for a malformed id too).
 */
export const getDeal = cache(async (segment: string, id: string) => {
  const workspaceId = toWorkspaceId(segment);
  const dealId = toRecordId(id);
  if (workspaceId === undefined || dealId === undefined) {
    return { deal: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/deals/{id}', {
    params: { path: { workspaceId, id: dealId } },
  });

  return { deal: data, ...flags(response.status) };
});

/**
 * Loads a deal's stage history, newest first (`GET /workspaces/{id}/deals/{id}/history`).
 * @param segment The `[workspaceId]` route segment.
 * @param id The `[id]` route segment.
 * @returns The entries and the outcome flags (`notFound` for a malformed id too).
 */
export const getDealHistory = async (segment: string, id: string) => {
  const workspaceId = toWorkspaceId(segment);
  const dealId = toRecordId(id);
  if (workspaceId === undefined || dealId === undefined) {
    return { history: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/deals/{id}/history', {
    params: { path: { workspaceId, id: dealId } },
  });

  return { history: data, ...flags(response.status) };
};

/**
 * Loads the tags of the workspace's active contacts, each once, sorted
 * (`GET /workspaces/{id}/contacts/tags`): the tag filter's options and the tag suggestions.
 * @param segment The `[workspaceId]` route segment.
 * @returns The tags and the outcome flags.
 */
export const getContactTags = async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { tags: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/contacts/tags', {
    params: { path: { workspaceId } },
  });

  return { tags: data, ...flags(response.status) };
};

/**
 * Loads a page of the activities on one record, newest first (`GET /workspaces/{id}/activities`).
 * A company's include those on its contacts and deals.
 * @param segment The `[workspaceId]` route segment.
 * @param link The record, such as `{ companyId: 7 }`.
 * @param older Which page, from 0 (each holds the default page size), of those that happened
 *   before `to` (an instant, exclusive), or of all without it.
 * @param older.page The page.
 * @param older.to The instant they happened before.
 * @returns The page and the outcome flags.
 */
export const getActivities = async (
  segment: string,
  link: ActivityLink,
  older: { page: number; to?: string },
) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { activities: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/activities', {
    params: {
      path: { workspaceId },
      query: { ...link, to: older.to, page: older.page, size: PAGE_SIZES[0] },
    },
  });

  return { activities: data, ...flags(response.status) };
};

/**
 * Loads a page of the workspace's audit events, newest first (`GET /workspaces/{id}/audit-events`).
 * Any member may read one record's (`entityType` and `entityId` together); the rest needs
 * `AUDIT_READ`.
 * @param segment The `[workspaceId]` route segment.
 * @param query The filters and paging, as the backend names them.
 * @returns The page and the outcome flags (`forbidden`: no `AUDIT_READ`).
 */
export const getAuditEvents = async (segment: string, query: AuditQuery) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { events: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/audit-events', {
    params: { path: { workspaceId }, query },
  });

  return { events: data, ...flags(response.status) };
};

/**
 * Loads a page of tasks (`GET /workspaces/{id}/tasks`).
 * @param segment The `[workspaceId]` route segment.
 * @param query The filters, sort and paging, as the backend names them.
 * @returns The page and the outcome flags (`invalid`: the backend refused the query).
 */
export const getTasks = async (segment: string, query: TaskQuery) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { tasks: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/tasks', {
    params: { path: { workspaceId }, query },
  });

  return { tasks: data, ...flags(response.status) };
};

/**
 * Loads the caller's reminders (`GET /workspaces/{id}/reminders`): their overdue tasks, their
 * tasks due in the next 24 hours and their leads to follow up, at most 20 of each. Cached for
 * the request, so the shell's bell and a page share one call.
 * @param segment The `[workspaceId]` route segment.
 * @returns The reminders and the outcome flags.
 */
export const getReminders = cache(async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { reminders: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/reminders', {
    params: { path: { workspaceId } },
  });

  return { reminders: data, ...flags(response.status) };
});

/**
 * Loads the dashboard (`GET /workspaces/{id}/dashboard`): the workspace's counts, open pipeline
 * and stages as of now, the won and lost deals of a period, and the caller's tasks and the latest
 * activity and changes. The response names the `period` it used.
 * @param segment The `[workspaceId]` route segment.
 * @param period The period from the URL, read with `parsePeriod`; a day left out is the API's
 *   default (to: today, from: 29 days before).
 * @returns The dashboard and the outcome flags (`invalid`: the backend refused the period).
 */
export const getDashboard = async (segment: string, period: PeriodQuery) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { dashboard: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/dashboard', {
    params: { path: { workspaceId }, query: period },
  });

  return { dashboard: data, ...flags(response.status) };
};

/**
 * Loads the pipeline report (`GET /workspaces/{id}/reports/pipeline`): the open deals by stage
 * and by owner, as of now.
 * @param segment The `[workspaceId]` route segment.
 * @returns The report and the outcome flags.
 */
export const getPipelineReport = async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { report: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/reports/pipeline', {
    params: { path: { workspaceId } },
  });

  return { report: data, ...flags(response.status) };
};

/**
 * Loads the follow-ups report (`GET /workspaces/{id}/reports/follow-ups`): the overdue and
 * upcoming tasks and the due leads of the whole workspace, as of now, each with its count and
 * first items.
 * @param segment The `[workspaceId]` route segment.
 * @returns The report and the outcome flags.
 */
export const getFollowUpReport = async (segment: string) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { report: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/reports/follow-ups', {
    params: { path: { workspaceId } },
  });

  return { report: data, ...flags(response.status) };
};

/**
 * Loads the won and lost report (`GET /workspaces/{id}/reports/won-lost`): every month of the
 * period with its won and lost deals and the won totals per currency. The response names the
 * `period` it used.
 * @param segment The `[workspaceId]` route segment.
 * @param period The period from the URL, read with `parsePeriod`; a day left out is the API's
 *   default.
 * @returns The report and the outcome flags (`invalid`: the backend refused the period).
 */
export const getWonLostReport = async (segment: string, period: PeriodQuery) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { report: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/reports/won-lost', {
    params: { path: { workspaceId }, query: period },
  });

  return { report: data, ...flags(response.status) };
};

/**
 * Loads the funnel report (`GET /workspaces/{id}/reports/funnel`): the deals created in the
 * period and, for each stage, how many reached it. The response names the `period` it used and
 * the day the workspace's stage history starts.
 * @param segment The `[workspaceId]` route segment.
 * @param period The period from the URL, read with `parsePeriod`.
 * @returns The report and the outcome flags (`invalid`: the backend refused the period).
 */
export const getFunnelReport = async (segment: string, period: PeriodQuery) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { report: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/reports/funnel', {
    params: { path: { workspaceId }, query: period },
  });

  return { report: data, ...flags(response.status) };
};

/**
 * Loads the activities report (`GET /workspaces/{id}/reports/activities`): per member, the
 * activities logged in the period by type and the tasks completed. The response names the
 * `period` it used.
 * @param segment The `[workspaceId]` route segment.
 * @param period The period from the URL, read with `parsePeriod`.
 * @returns The report and the outcome flags (`invalid`: the backend refused the period).
 */
export const getActivityReport = async (segment: string, period: PeriodQuery) => {
  const workspaceId = toWorkspaceId(segment);
  if (workspaceId === undefined) {
    return { report: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/reports/activities', {
    params: { path: { workspaceId }, query: period },
  });

  return { report: data, ...flags(response.status) };
};

/**
 * Loads one task (`GET /workspaces/{id}/tasks/{id}`). Cached for the request, so the page and
 * its metadata share one call.
 * @param segment The `[workspaceId]` route segment.
 * @param id The `[id]` route segment.
 * @returns The task and the outcome flags (`notFound` for a malformed id too).
 */
export const getTask = cache(async (segment: string, id: string) => {
  const workspaceId = toWorkspaceId(segment);
  const taskId = toRecordId(id);
  if (workspaceId === undefined || taskId === undefined) {
    return { task: undefined, ...NOT_FOUND };
  }

  const api = await authedBackend();
  const { data, response } = await api.GET('/api/v1/workspaces/{workspaceId}/tasks/{id}', {
    params: { path: { workspaceId, id: taskId } },
  });

  return { task: data, ...flags(response.status) };
});

/**
 * Loads what a record page shows under its details: its open tasks by due time (the first 50),
 * its completed and cancelled ones, latest first (the first 20), the first page of its activity,
 * and the members (the task dialog's assignees).
 * @param segment The `[workspaceId]` route segment.
 * @param link The record, such as `{ companyId: 7 }`.
 * @returns The pages, the members, when they were read, and `unauthorized` (any of them 401).
 */
export const getRecordWork = async (segment: string, link: ActivityLink) => {
  const [open, closed, activities, members] = await Promise.all([
    getTasks(segment, { ...link, status: ['OPEN'], sort: 'DUE_AT', size: 50 }),
    getTasks(segment, {
      ...link,
      status: ['COMPLETED', 'CANCELLED'],
      sort: 'UPDATED_AT',
      direction: 'DESC',
      size: PAGE_SIZES[0],
    }),
    getActivities(segment, link, { page: 0 }),
    getMembers(segment),
  ]);

  return {
    open: open.tasks,
    closed: closed.tasks,
    activities: activities.activities,
    members: members.members,
    readAt: new Date().toISOString(),
    unauthorized: [open, closed, activities, members].some((result) => result.unauthorized),
  };
};

/**
 * Previews an invitation link (`GET /invitations/{token}`, public, so without the session: a
 * rejected access token must not hide the invitation).
 * @param token The link's token, already checked with `InvitationTokenValidation`. A secret:
 *   never log it.
 * @returns The invitation (workspace, email, role, status) and `notFound` (unknown token).
 */
export const getInvitationPreview = async (token: string) => {
  const { data, response } = await backend.GET('/api/v1/invitations/{token}', {
    params: { path: { token } },
  });

  return { invitation: data, notFound: response.status === 404 };
};

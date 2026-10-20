import { hasLocale } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { isApiError, toActionError } from '@/libs/api/ApiError';
import { authedBackend } from '@/libs/api/Backend';
import { COMPANY_LIST, CONTACT_LIST, DEAL_LIST, LEAD_LIST } from '@/libs/api/CrmQueries';
import { ACCESS_TOKEN_COOKIE, clearedSessionCookies, isSecureAppUrl } from '@/libs/Auth';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { parseListQuery } from '@/libs/crm/ListQuery';
import { toWorkspaceId } from '@/libs/crm/WorkspaceId';
import { Env } from '@/libs/Env';
import { routing } from '@/libs/I18nRouting';
import { DEFAULT_DEAL_VIEW } from '@/validations/crm/DealValidation';

type Api = Awaited<ReturnType<typeof authedBackend>>;
type Params = Record<string, string[]>;

/**
 * The search and the archived view of a list, as its export takes them.
 * @param query The list query.
 * @returns The params.
 */
const searched = (query: Pick<ListQuery, 'q' | 'archived' | 'unassigned'>) => ({
  q: query.q,
  archived: query.archived,
  unassigned: query.unassigned,
});

// Each list's export: its spec reads the URL as the list page does (what it can't take is dropped,
// and there is no paging or sort), and the filters go by the names the backend gave them. The
// body is parsed as a stream, so the rows are never held here.
const EXPORTS = {
  companies: async (api: Api, workspaceId: number, params: Params) => {
    const query = parseListQuery(COMPANY_LIST, params);

    return await api.GET('/api/v1/workspaces/{workspaceId}/companies/export', {
      params: { path: { workspaceId }, query: { ...query.filters, ...searched(query) } },
      parseAs: 'stream',
    });
  },
  contacts: async (api: Api, workspaceId: number, params: Params) => {
    const query = parseListQuery(CONTACT_LIST, params);

    return await api.GET('/api/v1/workspaces/{workspaceId}/contacts/export', {
      params: { path: { workspaceId }, query: { ...query.filters, ...searched(query) } },
      parseAs: 'stream',
    });
  },
  leads: async (api: Api, workspaceId: number, params: Params) => {
    const query = parseListQuery(LEAD_LIST, params);

    return await api.GET('/api/v1/workspaces/{workspaceId}/leads/export', {
      params: { path: { workspaceId }, query: { ...query.filters, ...searched(query) } },
      parseAs: 'stream',
    });
  },
  deals: async (api: Api, workspaceId: number, params: Params) => {
    const query = parseListQuery(DEAL_LIST, params);
    // Not `view`, which only the deals page reads. The board (its default view) applies only the
    // search, the owner and the company: the table's filters the view tabs keep in the URL don't.
    const { view, ownerId, companyId, ...table } = query.filters;

    return await api.GET('/api/v1/workspaces/{workspaceId}/deals/export', {
      params: {
        path: { workspaceId },
        query:
          (view ?? DEFAULT_DEAL_VIEW) === 'board'
            ? { q: query.q, ownerId, unassigned: query.unassigned, companyId }
            : { ...table, ownerId, companyId, ...searched(query) },
      },
      parseAs: 'stream',
    });
  },
};

/**
 * `GET /api/crm/{workspaceId}/export/{list}`: the CSV of a list for the filters of its page's URL
 * (`?locale=` picks the language of a refusal). The browser asks here and never the backend: the
 * session's token stays on the server. The file streams through with the backend's `Content-Type`
 * and `Content-Disposition` (an `attachment` without one), never sniffed; a refusal is JSON
 * `{ message }`, translated by its code (a file over the cap, a role without `EXPORT`). A 401 ends
 * the session as an action's does (the cookies go, unless the request sent no access token), but
 * the browser fetches this and a redirect would hand it the sign-in page as the file: it gets a
 * bare 401, which the button turns into the navigation to sign in. Another site can't start one:
 * the session cookies are `SameSite=Lax`, so its link or form would open this with them, and the
 * export would be recorded in the user's name. A request the browser marks
 * `Sec-Fetch-Site: cross-site` or `same-site` (a sibling subdomain; the app's own pages send
 * `same-origin`, a typed URL `none`) is refused (403) unasked.
 * @param request The request.
 * @param context The route's params.
 * @param context.params `workspaceId` and `list` (companies, contacts, leads or deals).
 * @returns The file, or the JSON refusal.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ workspaceId: string; list: string }> },
) {
  const { workspaceId: segment, list } = await context.params;
  const { searchParams } = request.nextUrl;
  const requested = searchParams.get('locale');
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const tError = await getTranslations({ locale, namespace: 'ApiError' });
  const workspaceId = toWorkspaceId(segment);
  const run = Object.entries(EXPORTS).find(([name]) => name === list)?.[1];
  if (!run || workspaceId === undefined) {
    return NextResponse.json({ message: tError('status_404') }, { status: 404 });
  }
  const site = request.headers.get('sec-fetch-site');
  if (site === 'cross-site' || site === 'same-site') {
    return NextResponse.json({ message: tError('status_403') }, { status: 403 });
  }

  let result: Awaited<ReturnType<typeof run>>;
  try {
    const params = Object.fromEntries(
      [...new Set(searchParams.keys())].map((key) => [key, searchParams.getAll(key)]),
    );
    result = await run(await authedBackend(), workspaceId, params);
  } catch {
    // The backend can't be reached from here: the browser reached this server, so it isn't told
    // to check its connection.
    return NextResponse.json({ message: tError('generic') }, { status: 502 });
  }
  const { data, error, response } = result;

  if (response.status === 401) {
    const ended = new NextResponse(null, { status: 401 });
    // Only the token this request sent was rejected. Without one, the cookies the browser holds
    // now may be newer (a parallel request won the refresh race): keep them.
    if (request.cookies.get(ACCESS_TOKEN_COOKIE)?.value) {
      for (const cookie of clearedSessionCookies(isSecureAppUrl(Env.APP_URL))) {
        ended.cookies.set(cookie);
      }
    }

    return ended;
  }
  if (!response.ok) {
    // No field is on screen to highlight (a refused filter shows on the list page itself): the
    // refusal reads as a request that isn't valid, not "check the highlighted fields".
    const body: unknown = error;
    const refusal = isApiError(body) ? { ...body, fieldErrors: undefined } : body;

    return NextResponse.json(
      { message: toActionError(refusal, tError).message },
      { status: response.status },
    );
  }

  // The file holds what users typed: the browser never sniffs it into a page, and saves it even
  // when a proxy in front of the backend dropped its name.
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Content-Disposition': 'attachment',
    'X-Content-Type-Options': 'nosniff',
  });
  for (const name of ['Content-Type', 'Content-Disposition']) {
    const value = response.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  return new Response(data, { headers });
}

/**
 * `HEAD` on the export: refused (405). Without it Next answers `HEAD` by running `GET`, which
 * exports, and records the export, only to drop the file.
 * @returns The refusal, naming the method that works.
 */
export const HEAD = () => new Response(null, { status: 405, headers: { Allow: 'GET' } });

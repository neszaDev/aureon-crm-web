import { authedBackend } from '@/libs/api/Backend';

/** Headers passed on from the backend; everything else (cookies, server details) stays behind. */
const PASSED_HEADERS = ['content-type', 'content-length', 'content-disposition'];

/**
 * Streams one of the signed-in user's files from the backend. The browser never talks to the
 * backend, and the access token stays in its httpOnly cookie. The proxy refreshes the token
 * first, since this path is under /dashboard.
 * @param _request The request.
 * @param context Route context.
 * @param context.params The file id.
 * @returns The file as a download, or an empty 404/401.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const params = await context.params;
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1) {
    return new Response(null, { status: 404 });
  }

  const api = await authedBackend();
  const { response } = await api.GET('/api/v1/files/{id}/content', {
    params: { path: { id } },
    parseAs: 'stream',
  });
  if (!response.ok) {
    return new Response(null, { status: response.status === 401 ? 401 : 404 });
  }

  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    'Content-Security-Policy': "sandbox; default-src 'none'",
    'X-Content-Type-Options': 'nosniff',
  });
  for (const name of PASSED_HEADERS) {
    const value = response.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }

  return new Response(response.body, { headers });
}

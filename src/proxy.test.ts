import { NextRequest, NextResponse } from 'next/server';
import { describe, expect, it, vi } from 'vitest';
import proxy from './proxy';

const { refresh, routeI18n } = vi.hoisted(() => ({
  // The refresh token is refused: there is no session.
  refresh: vi
    .fn<() => Promise<{ response: Response }>>()
    .mockResolvedValue({ response: new Response(null, { status: 401 }) }),
  routeI18n: vi.fn<(request: NextRequest) => NextResponse>(),
}));

// @ts-expect-error -- only the call the proxy makes
vi.mock(import('@/libs/api/Backend'), () => ({ backend: { POST: refresh } }));
vi.mock(import('next-intl/middleware'), () => ({ default: () => routeI18n }));

/**
 * A request for a CRM page carrying a server action's id, from a browser whose session expired.
 * @param method The HTTP method.
 * @returns The request.
 */
const actionRequest = (method: string) =>
  new NextRequest('http://localhost:3000/app/7/settings/workspace', {
    method,
    headers: { 'next-action': '7f00ab', cookie: 'refresh_token=expired' },
  });

describe(proxy, () => {
  it('sends a GET to sign in even with an action id', async () => {
    const response = await proxy(actionRequest('GET'));

    expect(refresh).toHaveBeenCalledOnce();
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/sign-in?next=%2Fapp%2F7%2Fsettings%2Fworkspace',
    );
    expect(routeI18n).not.toHaveBeenCalled();
  });

  it('passes a server action on to i18n routing: the action ends the session itself', async () => {
    const request = actionRequest('POST');
    const passed = NextResponse.next();
    routeI18n.mockReturnValue(passed);

    await expect(proxy(request)).resolves.toBe(passed);
    expect(routeI18n).toHaveBeenCalledWith(request);
  });
});

import { randomUUID } from 'node:crypto';
import { setTimeout as sleep } from 'node:timers/promises';
import type { Page, Request, Response } from '@playwright/test';
import { expect, test } from '@playwright/test';
import {
  addMember,
  apiCall,
  BACKEND_URL,
  createCompany,
  createWorkspace,
  invite,
  registerUser,
  seed,
  seedWorkspace,
  waitForHydration,
} from './crm/helpers';
import { ADMIN, PASSWORD, signIn, signUp, uniqueEmail } from './helpers';

// Security probes: each one attacks the app as a browser, another site or a curious member could,
// against the running app and the real backend. The unit tests of the same rules sit beside their
// code (SafeRedirect, Auth, Session, the routes, proxy.security.test.ts).

// Text that becomes an element, and runs, if any page renders it as markup.
const XSS = '"><img src=x onerror=window.__xss=1>';

// What a response whose body never arrived reads as.
const STALLED = 'stalled';

/** A server action call as the browser sent it. */
type ActionCall = { url: string; headers: Record<string, string>; body: string };

/**
 * Tells a server action call from any other request.
 * @param request The request.
 * @returns Whether it calls a server action.
 */
const isAction = (request: Request) =>
  request.method() === 'POST' && Boolean(request.headers()['next-action']);

/**
 * Runs a UI step and captures the server action it sends, which never reaches the server.
 * @param page Playwright page.
 * @param step What sends the action, such as a click.
 * @returns The call: its URL, the headers that make it an action, and its body.
 */
const captureAction = async (page: Page, step: () => Promise<void>) => {
  await page.route('**/*', async (route) => {
    await (isAction(route.request()) ? route.abort() : route.fallback());
  });
  const [request] = await Promise.all([page.waitForRequest(isAction), step()]);
  await page.unroute('**/*');
  const headers = await request.allHeaders();
  const call: ActionCall = {
    url: request.url(),
    headers: Object.fromEntries(
      ['next-action', 'next-router-state-tree', 'content-type', 'accept'].map((name) => [
        name,
        headers[name] ?? '',
      ]),
    ),
    body: request.postData() ?? '',
  };

  return call;
};

/**
 * Captures the create-company action of the signed-in user's workspace, for a company that is
 * never created.
 * @param page Playwright page, signed in.
 * @param workspace The workspace's URL.
 * @param name The company's name.
 * @returns The call.
 */
const captureCreateCompany = async (page: Page, workspace: string, name: string) => {
  await page.goto(`${workspace}/companies/new`);
  await waitForHydration(page.locator('form'));
  const field = page.getByLabel('Company name');
  await field.fill(name);

  // Enter, not a click: leaving the field would send the look-alike check first.
  return await captureAction(page, async () => {
    await field.press('Enter');
  });
};

/**
 * Sends a captured action again from a page's browser context, with its cookies.
 * @param page Playwright page.
 * @param call The captured call.
 * @param change What to send differently.
 * @param change.origin The `Origin` header.
 * @param change.body The body.
 * @returns The response.
 */
const replay = async (page: Page, call: ActionCall, change: { origin: string; body?: string }) =>
  await page.request.post(call.url, {
    headers: { ...call.headers, origin: change.origin },
    data: change.body ?? call.body,
    maxRedirects: 0,
  });

/**
 * The access token the browser holds, to ask the backend directly what the app did.
 * @param page Playwright page, signed in.
 * @returns The `Authorization` header.
 */
const backendAuth = async (page: Page) => {
  const cookies = await page.context().cookies();

  return {
    Authorization: `Bearer ${cookies.find((cookie) => cookie.name === 'access_token')?.value}`,
  };
};

/**
 * Asks the backend how many companies of a workspace match a name.
 * @param page Playwright page, for its API client.
 * @param headers The `Authorization` header of a member.
 * @param workspaceId The workspace.
 * @param name The name.
 * @returns How many match.
 */
const companiesNamed = async (
  page: Page,
  headers: { Authorization: string },
  workspaceId: number | string,
  name: string,
) => {
  const response = await page.request.get(
    `${BACKEND_URL}/api/v1/workspaces/${workspaceId}/companies?q=${encodeURIComponent(name)}`,
    { headers },
  );
  expect(response.status()).toBe(200);
  const body: { content: unknown[] } = await response.json();

  return body.content.length;
};

/**
 * The workspace id at the end of a workspace URL.
 * @param url The URL.
 * @returns The id.
 */
const workspaceIdOf = (url: string) => new URL(url).pathname.split('/').at(-1) ?? '';

/**
 * Opens a page of another site whose body is `html`.
 * @param page Playwright page.
 * @param html The page's body.
 */
const openElsewhere = async (page: Page, html: string) => {
  await page.route('http://elsewhere.example/', async (route) => {
    await route.fulfill({ contentType: 'text/html', body: html });
  });
  await page.goto('http://elsewhere.example/');
};

/**
 * Reads a response's body; a redirect has none.
 * @param response The response.
 * @returns The body, or nothing.
 */
const bodyOf = async (response: Response) => {
  try {
    return await response.text();
  } catch {
    return '';
  }
};

/**
 * Reads what the browser received: the cookies a response sets, and its body (a prefetch the
 * router dropped never ends: `STALLED` after 5 s).
 * @param response The response.
 * @returns Its URL, type, `Cache-Control`, cookies and body.
 */
const received = async (response: Response) => {
  const headers = response.headers();
  const all = await response.headersArray();
  const cookies = all
    .filter((header) => header.name.toLowerCase() === 'set-cookie')
    .flatMap((header) => header.value.split('\n'));

  return {
    url: response.url(),
    type: headers['content-type'] ?? '',
    cache: headers['cache-control'] ?? '',
    cookies,
    text: await Promise.race([bodyOf(response), sleep(5000, STALLED)]),
  };
};

/**
 * The origin of the app.
 * @param baseURL Playwright's `baseURL`.
 * @returns The origin.
 */
const originOf = (baseURL?: string) => new URL(baseURL ?? '').origin;

// Another site's page reaches this app as it would in production, where neither is on a local
// network: Chrome would otherwise block its frames before the app could answer.
test.use({ launchOptions: { args: ['--disable-features=LocalNetworkAccessChecks'] } });

test.describe('Security', () => {
  test.describe('Session', () => {
    test('keeps the tokens in httpOnly cookies, out of every page, payload and script', async ({
      page,
      context,
    }) => {
      const responses: ReturnType<typeof received>[] = [];
      page.on('response', (response) => {
        responses.push(received(response));
      });

      // Sign-up (an action sets the cookies), pages, an action, client navigation, and the proxy's
      // refresh (a second pair).
      await signUp(page);
      const workspace = await createWorkspace(page, 'Acme');
      await createCompany(page, workspace, { name: 'Initech' });
      await context.clearCookies({ name: 'access_token' });
      await page.goto(`${workspace}/companies`);
      await page.getByRole('link', { name: 'Initech' }).click();
      await expect(page.getByRole('heading', { level: 1, name: 'Initech' })).toBeVisible();

      const all = await Promise.all(responses);
      expect(all.length).toBeGreaterThan(20);
      const session = all
        .flatMap((response) => response.cookies)
        .filter((cookie) => /^(?:access|refresh)_token=[^;]/u.test(cookie));
      const valuesOf = (name: string) =>
        session
          .filter((cookie) => cookie.startsWith(`${name}=`))
          .map((cookie) => cookie.split(';')[0]?.slice(name.length + 1) ?? '');
      const tokens = new Set([...valuesOf('access_token'), ...valuesOf('refresh_token')]);
      // Sign-up's pair and the refresh's (an access token issued in the same second is the same).
      expect(new Set(valuesOf('refresh_token')).size).toBeGreaterThanOrEqual(2);
      expect(valuesOf('access_token').length).toBeGreaterThan(1);
      for (const cookie of session) {
        expect(cookie).toMatch(/; HttpOnly(?:;|$)/iu);
        expect(cookie).toMatch(/; SameSite=lax(?:;|$)/iu);
        expect(cookie).toMatch(/; Path=\/(?:;|$)/u);
        expect(cookie).toMatch(/; Max-Age=\d+/u);
        expect(cookie).not.toMatch(/; Domain=/iu);
      }
      const locales = all
        .flatMap((response) => response.cookies)
        .filter((cookie) => cookie.startsWith('NEXT_LOCALE='));
      expect(locales.filter((cookie) => !/; SameSite=lax(?:;|$)/iu.test(cookie))).toStrictEqual([]);
      const browserCookies = await context.cookies();
      expect(
        browserCookies
          .filter((cookie) => cookie.name.endsWith('_token'))
          .map((cookie) => `${cookie.name} httpOnly=${cookie.httpOnly} ${cookie.sameSite}`)
          .toSorted(),
      ).toStrictEqual(['access_token httpOnly=true Lax', 'refresh_token httpOnly=true Lax']);
      expect(await page.evaluate(() => document.cookie)).not.toMatch(/_token=/u);

      // Prefetches the router dropped (their bodies are gone or never end), read again as the
      // browser asked for them.
      const dropped = (response: { url: string; text: string }) =>
        response.text === STALLED || (response.text === '' && response.url.includes('_rsc='));
      const bodies = await Promise.all(
        all.map(async (response) => {
          if (!dropped(response)) {
            return response;
          }
          const again = await page.request.get(response.url, { headers: { rsc: '1' } });

          return { ...response, text: await again.text() };
        }),
      );
      expect(bodies.filter((body) => dropped(body)).map((body) => body.url)).toStrictEqual([]);
      const leaks = bodies.filter((body) => [...tokens].some((token) => body.text.includes(token)));
      expect(leaks.map((body) => `${body.type} ${body.url}`)).toStrictEqual([]);
      // Personal pages and their payloads are never stored, by the browser or a shared cache.
      expect(
        bodies
          .filter((body) => new URL(body.url).pathname.startsWith('/app'))
          .filter((body) => /text\/(?:html|x-component)/u.test(body.type))
          .filter((body) => !body.cache.includes('no-store'))
          .map((body) => `${body.url} ${body.cache}`),
      ).toStrictEqual([]);
      // The browser never learns where the backend is.
      const scripts = bodies.filter((body) => body.type.includes('javascript'));
      expect(scripts.length).toBeGreaterThan(0);
      expect(
        scripts
          .filter((body) => body.text.includes('/api/v1/') || body.text.includes(BACKEND_URL))
          .map((body) => body.url),
      ).toStrictEqual([]);
    });

    test('shares a refresh with a stale refresh token for 2 seconds at most', async ({
      request,
      baseURL,
    }) => {
      const registered = await request.post(`${BACKEND_URL}/api/v1/auth/register`, {
        data: { email: uniqueEmail(), password: PASSWORD },
      });
      const { refreshToken }: { refreshToken: string } = await registered.json();
      // The CRM's API routes get their session refreshed, and this one answers at once (no list).
      const refreshWith = async (token: string) => {
        const response = await fetch(`${originOf(baseURL)}/api/crm/1/export/none`, {
          headers: { cookie: `refresh_token=${token}` },
          redirect: 'manual',
        });

        return /^refresh_token=([^;]+)/mu.exec(response.headers.getSetCookie().join('\n'))?.[1];
      };

      const rotated = await refreshWith(refreshToken);
      expect(rotated).toBeDefined();
      // The documented trade-off: right after the rotation, the old token gets the same new pair.
      expect(await refreshWith(refreshToken)).toBe(rotated);
      // Then the old token gets nothing (the backend refuses it), and the new one still works.
      await expect
        .poll(async () => await refreshWith(refreshToken), { timeout: 10_000, intervals: [500] })
        .toBeUndefined();
      expect(await refreshWith(rotated ?? '')).toBeDefined();
    });
  });

  test.describe('Server actions', () => {
    test("refuse a call from another origin, even with the session's cookies", async ({ page }) => {
      await signUp(page);
      const workspace = await createWorkspace(page, 'Acme');
      const name = `Forged ${randomUUID()}`;
      const call = await captureCreateCompany(page, workspace, name);
      const auth = await backendAuth(page);

      // Another site; a sibling subdomain, whose requests would carry the SameSite=Lax cookies;
      // a sandboxed frame.
      const origins = ['http://elsewhere.example', 'http://evil.localhost:3105', 'null'];
      const forged = await Promise.all(
        origins.map(async (origin) => await replay(page, call, { origin })),
      );

      expect(forged.map((response) => response.status())).toStrictEqual([500, 500, 500]);
      expect(forged.map((response) => response.headers()['x-action-redirect'])).toStrictEqual([
        undefined,
        undefined,
        undefined,
      ]);
      expect(await companiesNamed(page, auth, workspaceIdOf(workspace), name)).toBe(0);

      // The same call from the app's own origin goes through: the origin was the refusal.
      const own = await replay(page, call, { origin: new URL(workspace).origin });

      expect(own.headers()['x-action-redirect']).toMatch(/\/companies\/\d+;/u);
      expect(await companiesNamed(page, auth, workspaceIdOf(workspace), name)).toBe(1);
    });

    test("can't reach another workspace by changing the id they send", async ({
      page,
      request,
    }) => {
      const other = await seedWorkspace(request);
      await signUp(page);
      const workspace = await createWorkspace(page, 'Acme');
      const name = `Planted ${randomUUID()}`;
      const call = await captureCreateCompany(page, workspace, name);
      const ownId = workspaceIdOf(workspace);
      expect(call.body.startsWith(`[${ownId},`)).toBe(true);

      // Another workspace's id, and paths that would leave the workspace's URL on the backend.
      const ids = [String(other.workspaceId), '"."', '".."', `"${other.workspaceId}/.."`];
      const answers = await Promise.all(
        ids.map(async (id) => {
          const response = await replay(page, call, {
            origin: new URL(workspace).origin,
            body: call.body.replace(`[${ownId},`, `[${id},`),
          });
          const text = await response.text();

          return `${id} ${response.status()} ${response.headers()['x-action-redirect']} ${text.includes('"ok":false')}`;
        }),
      );

      expect(answers).toStrictEqual(ids.map((id) => `${id} 200 undefined true`));
      expect(await companiesNamed(page, other.headers, other.workspaceId, name)).toBe(0);
      expect(await companiesNamed(page, await backendAuth(page), ownId, name)).toBe(0);

      // Nor read it: its pages and its export are refused as if it didn't exist.
      const secret = await seed(request, other, 'companies', { name: `Secret ${randomUUID()}` });
      const response = await page.goto(`${other.path}/companies/${secret.id}`);
      expect(response?.status()).toBe(404);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(
        "Workspace not found or you're not a member",
      );
      expect(await response?.text()).not.toContain('Secret');
      const exported = await page.request.get(`/api/crm/${other.workspaceId}/export/companies`);
      expect(exported.status()).toBe(404);
      expect(await exported.text()).not.toContain('Secret');
    });

    test("don't let a sales rep give themselves a workspace role", async ({
      page,
      browser,
      request,
      baseURL,
    }) => {
      const owner = await seedWorkspace(request);
      const rep = await addMember(request, owner, 'SALES_REP');
      await signIn(page, { email: owner.email, password: PASSWORD });
      await page.goto(`${owner.path}/settings/members`);
      const role = page.getByLabel(`Role of ${rep.email}`);
      await waitForHydration(role);
      const call = await captureAction(page, async () => {
        await role.selectOption('ADMIN');
      });

      // The rep, in their own browser, sends the owner's call for themselves.
      const own = await browser.newContext();
      const repPage = await own.newPage();
      await signIn(repPage, { email: rep.email, password: PASSWORD });
      const response = await replay(repPage, call, { origin: originOf(baseURL) });

      expect(await response.text()).toContain('"ok":false');
      const members = await apiCall<{ userId: number; role: string }[]>(
        request,
        owner,
        'GET',
        `/workspaces/${owner.workspaceId}/members`,
      );
      expect(members.find((member) => member.userId === rep.userId)?.role).toBe('SALES_REP');
      await own.close();
    });

    test("don't let a user make themselves an admin of the app", async ({
      page,
      browser,
      request,
      baseURL,
    }) => {
      const user = await registerUser(request);
      await signIn(page, ADMIN);
      await page.goto(`/dashboard/users/${user.userId}`);
      const role = page.getByLabel('Role');
      await waitForHydration(role);
      await role.selectOption('ADMIN');
      const call = await captureAction(page, async () => {
        await page.getByRole('button', { name: 'Save changes' }).click();
      });

      const own = await browser.newContext();
      const userPage = await own.newPage();
      await signIn(userPage, { email: user.email, password: PASSWORD });
      const response = await replay(userPage, call, { origin: originOf(baseURL) });

      expect(await response.text()).toContain('"ok":false');
      const me = await apiCall<{ role: string }>(request, user, 'GET', '/users/me');
      expect(me.role).toBe('USER');
      await own.close();
    });

    test("answer a call that fails on the server without the server's error", async ({ page }) => {
      await signUp(page);
      const workspace = await createWorkspace(page, 'Acme');
      const call = await captureCreateCompany(page, workspace, 'Broken');

      const response = await replay(page, call, {
        origin: new URL(workspace).origin,
        body: call.body.slice(0, -3),
      });

      expect(response.status()).toBe(500);
      const text = await response.text();
      expect(text).toMatch(/"digest":"\d+"/u);
      expect(text).not.toMatch(/SyntaxError|JSON|\bat\s|node_modules|\.next\/|\/Users\//u);
    });
  });

  test.describe('Another site', () => {
    test("can't export a list in the user's name, and HEAD exports nothing", async ({
      page,
      request,
      baseURL,
    }) => {
      const owner = await seedWorkspace(request);
      await seed(request, owner, 'companies', { name: '=HYPERLINK("http://evil.example","x")' });
      await signIn(page, { email: owner.email, password: PASSWORD });
      const exportUrl = `${originOf(baseURL)}/api/crm/${owner.workspaceId}/export/companies`;

      const answered = page.waitForResponse(exportUrl);
      await openElsewhere(page, `<a href="${exportUrl}">Export</a>`);
      await page.getByRole('link', { name: 'Export' }).click();
      const refused = await answered;
      const head = await page.request.head(exportUrl);

      expect(refused.status()).toBe(403);
      expect(head.status()).toBe(405);

      // From the app itself: the file, never cached or sniffed, its cells never formulas.
      const file = await page.request.get(exportUrl);
      expect(file.status()).toBe(200);
      expect(file.headers()).toMatchObject({
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      });
      expect(file.headers()['content-disposition']).toMatch(/^attachment/u);
      // No other site may read it with the user's cookies.
      expect(file.headers()['access-control-allow-origin']).toBeUndefined();
      expect(await file.text()).toContain(`"'=HYPERLINK(""http://evil.example"",""x"")"`);
    });

    test('frames only the sign-in page: the session cookies stay out of its frames', async ({
      page,
      request,
      baseURL,
    }) => {
      const owner = await seedWorkspace(request, { workspace: 'Framed Workspace' });
      await signIn(page, { email: owner.email, password: PASSWORD });

      await openElsewhere(
        page,
        `<iframe title="App" src="${originOf(baseURL)}${owner.path}"></iframe>`,
      );

      const frame = page.frameLocator('iframe');
      await expect(frame.getByRole('button', { name: 'Sign in' })).toBeVisible();
      await expect(frame.getByText('Framed Workspace')).toHaveCount(0);
      // The tab itself is still signed in.
      await page.goto(owner.path);
      await expect(page.getByText('what changed in Framed Workspace.')).toBeVisible();
    });
  });

  test.describe('Routing', () => {
    test('never redirects anyone to another site', async ({ request, baseURL }) => {
      const origin = originOf(baseURL);
      const registered = await request.post(`${BACKEND_URL}/api/v1/auth/register`, {
        data: { email: uniqueEmail(), password: PASSWORD },
      });
      const { accessToken }: { accessToken: string } = await registered.json();
      const paths = [
        '//evil.example/',
        '/\\evil.example',
        '/fr//evil.example/',
        '/app/%2F%2Fevil.example',
        '/fr/app//evil.example',
        '/sign-in?next=https://evil.example',
        '/sign-in?next=//evil.example',
        '/sign-in?next=/%5Cevil.example',
        '/sign-in?next=/app@evil.example',
        '/sign-in?next=%2F%09%2Fevil.example',
        '/fr/sign-up?next=/invite/x/../../%2F%2Fevil.example',
        '/sign-in?next=/app%0d%0aLocation:%20https://evil.example',
        '/api/session/expired?locale=//evil.example',
      ];
      const asked = [
        // Signed out and signed in, as a string so that no client tidies the path first.
        ...paths.map((path) => ({ path, headers: {} })),
        ...paths.map((path) => ({ path, headers: { cookie: `access_token=${accessToken}` } })),
        // Nor where a request says it was sent to.
        ...['/app', '/api/session/expired', '/fr'].map((path) => ({
          path,
          headers: { 'x-forwarded-host': 'evil.example' },
        })),
      ];

      const targets = await Promise.all(
        asked.map(async ({ path, headers }) => {
          const response = await request.get(`${origin}${path}`, { maxRedirects: 0, headers });
          const { location } = response.headers();

          return location ? new URL(location, origin).origin : origin;
        }),
      );

      expect(targets.filter((target) => target !== origin)).toStrictEqual([]);
    });

    test('never puts a password in a URL, even before the page runs its script', async ({
      request,
      baseURL,
    }) => {
      const { path } = await invite(request, uniqueEmail());
      const pages = ['/sign-in', '/sign-up', '/fr/sign-in', path];

      const forms = await Promise.all(
        pages.map(async (page) => {
          const response = await request.get(`${originOf(baseURL)}${page}`);
          const html = await response.text();

          return html.match(/<form\b[^>]*>/gu) ?? [];
        }),
      );

      expect(forms.map((found) => found.length > 0)).toStrictEqual(pages.map(() => true));
      expect(forms.flat().filter((form) => !form.includes('method="post"'))).toStrictEqual([]);
    });

    test('keeps a list working whatever its URL asks for, and exports it the same way', async ({
      page,
      request,
    }) => {
      const owner = await seedWorkspace(request);
      await seed(request, owner, 'companies', { name: 'Acme Trading' });
      await signIn(page, { email: owner.email, password: PASSWORD });
      const query =
        "?sort=name;DROP TABLE companies&direction=sideways&page=-1&size=100000&q=' OR 1=1 --&archived=maybe&ownerId=1 OR 1=1";

      const response = await page.goto(`${owner.path}/companies${query}`);

      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: 'Companies' })).toBeVisible();
      const exported = await page.request.get(
        `/api/crm/${owner.workspaceId}/export/companies${query}`,
      );
      expect(exported.status()).toBe(200);
      expect(await exported.text()).not.toMatch(/SQL|syntax|exception|\bat\s/iu);
    });

    test('keeps the CRM, the demos and their routes behind sign-in, whatever the request claims', async ({
      request,
      baseURL,
    }) => {
      const origin = originOf(baseURL);
      // The header of CVE-2025-29927, which once let a request skip the middleware.
      const claims = ['proxy', 'middleware', 'src/proxy', 'src/middleware'].flatMap((name) =>
        ['/app', '/fr/dashboard/users', '/dashboard/widgets'].map((path) => ({
          path,
          subrequest: Array.from({ length: 5 }, () => name).join(':'),
        })),
      );

      const answers = await Promise.all(
        claims.map(async ({ path, subrequest }) => {
          const response = await request.get(`${origin}${path}`, {
            maxRedirects: 0,
            headers: { 'x-middleware-subrequest': subrequest },
          });
          const { location } = response.headers();

          return `${response.status()} ${/\/sign-in(?:\?|$)/u.test(location ?? '')}`;
        }),
      );

      expect(answers).toStrictEqual(claims.map(() => '307 true'));
      const crmApi = await request.get(`${origin}/api/crm/1/export/companies`);
      expect(crmApi.status()).toBe(401);
      const file = await request.get(`${origin}/dashboard/files/1/content`, { maxRedirects: 0 });
      expect(file.headers().location).toMatch(/\/sign-in$/u);
      // A path with a dot skips the proxy; the layout still asks the backend, which refuses.
      const dotted = await request.get(`${origin}/en/app/1/companies/1.json`, { maxRedirects: 0 });
      expect(dotted.headers().location).toMatch(/^\/api\/session\/expired\?/u);
    });
  });

  test.describe('Pages', () => {
    test('send a sales rep none of what their role hides, such as pending invitations', async ({
      page,
      request,
    }) => {
      const owner = await seedWorkspace(request);
      const rep = await addMember(request, owner, 'SALES_REP');
      const invited = uniqueEmail();
      await apiCall(request, owner, 'POST', `/workspaces/${owner.workspaceId}/invitations`, {
        email: invited,
        role: 'ADMIN',
      });
      // The owner's page lists the pending invitation, so a leak would show.
      const ownerPage = await request.get(`${owner.path}/settings/members`, {
        headers: { cookie: `access_token=${owner.headers.Authorization.slice('Bearer '.length)}` },
      });
      expect(await ownerPage.text()).toContain(invited);
      await signIn(page, { email: rep.email, password: PASSWORD });

      const pages = await Promise.all(
        ['/settings/members', '/settings/audit', '/settings/roles'].map(async (path) => {
          const response = await page.request.get(`${owner.path}${path}`);

          return { status: response.status(), text: await response.text() };
        }),
      );

      expect(pages.map((shown) => shown.status)).toStrictEqual([200, 200, 200]);
      expect(pages.filter((shown) => shown.text.includes(invited))).toStrictEqual([]);
    });

    test('show what users typed as text, never as markup', async ({ page, request }) => {
      test.slow();
      const owner = await seedWorkspace(request, {
        workspace: `Acme ${XSS}`,
        owner: `Olivia ${XSS}`,
      });
      const company = await seed(request, owner, 'companies', {
        name: `Initech ${XSS}`,
        industry: XSS,
        notes: XSS,
        website: `https://example.com/${encodeURIComponent(XSS)}`,
      });
      const contact = await seed(request, owner, 'contacts', {
        firstName: `Ada ${XSS}`,
        lastName: XSS,
        jobTitle: XSS,
        companyId: company.id,
      });
      const lead = await seed(request, owner, 'leads', {
        firstName: `Noa ${XSS}`,
        lastName: XSS,
        companyName: XSS,
      });
      const deal = await seed(request, owner, 'deals', {
        name: `Seats ${XSS}`,
        amount: '10.00',
        companyId: company.id,
      });
      const task = await seed(request, owner, 'tasks', {
        title: `Call ${XSS}`,
        description: XSS,
        companyId: company.id,
        dueAt: new Date(Date.now() + 3_600_000).toISOString(),
      });
      await seed(request, owner, 'activities', {
        type: 'NOTE',
        subject: `Note ${XSS}`,
        body: XSS,
        companyId: company.id,
      });
      const invitation = await apiCall<{ token: string }>(
        request,
        owner,
        'POST',
        `/workspaces/${owner.workspaceId}/invitations`,
        { email: uniqueEmail(), role: 'SALES_REP' },
      );
      await signIn(page, { email: owner.email, password: PASSWORD });

      const pages = [
        owner.path,
        `${owner.path}/companies`,
        `${owner.path}/companies/${company.id}`,
        `${owner.path}/contacts`,
        `${owner.path}/contacts/${contact.id}`,
        `${owner.path}/leads/${lead.id}`,
        `${owner.path}/deals`,
        `${owner.path}/deals/${deal.id}`,
        `${owner.path}/tasks/${task.id}`,
        `${owner.path}/settings/audit`,
        `${owner.path}/settings/members`,
        `/invite/${invitation.token}`,
      ];
      for (const url of pages) {
        // oxlint-disable-next-line no-await-in-loop -- one page after the other
        await page.goto(url);
        // oxlint-disable-next-line no-await-in-loop -- see above
        await expect(page.getByText(/onerror=window.__xss=1/u).first(), url).toBeAttached();
        // oxlint-disable-next-line no-await-in-loop -- see above
        await expect(page.locator('img[src="x"]'), url).toHaveCount(0);
      }
      await page.goto(`${owner.path}/companies/${company.id}`);
      await expect(page).toHaveTitle(`Initech ${XSS}`);

      await page.goto(owner.path);
      await waitForHydration(page.getByRole('button', { name: 'Search records' }));
      await page.keyboard.press('Control+K');
      await page.getByRole('combobox', { name: 'Search records' }).fill('Initech');
      await expect(page.getByRole('option', { name: /^C-\d{4} Initech/u })).toBeVisible();
      await expect(page.locator('img[src="x"]')).toHaveCount(0);
      expect(await page.evaluate(() => '__xss' in globalThis)).toBe(false);
    });

    test('serve an uploaded file only as a sandboxed download, and its name as text', async ({
      page,
    }) => {
      await signUp(page);
      await page.goto('/dashboard/files');
      const input = page.getByLabel('File', { exact: true });
      await waitForHydration(input);
      await input.setInputFiles({
        name: `${XSS}.txt`,
        mimeType: 'text/plain',
        buffer: Buffer.from('<script>window.__xss=1</script>'),
      });
      await page.getByRole('button', { name: 'Upload' }).click();

      // The browser sends the quote in the name as %22.
      const link = page.getByRole('link', { name: /<img src=x onerror=window.__xss=1>\.txt$/u });
      await expect(link).toBeVisible();
      await expect(page.locator('img[src="x"]')).toHaveCount(0);
      const href = await link.getAttribute('href');
      const file = await page.request.get(href ?? '');
      expect(file.headers()).toMatchObject({
        'cache-control': 'private, no-store',
        'content-security-policy': "sandbox; default-src 'none'",
        'x-content-type-options': 'nosniff',
      });
      expect(file.headers()['content-disposition']).toMatch(/^attachment/u);
      expect(file.headers()['set-cookie'] ?? '').not.toMatch(/_token=/u);
    });

    test('stay static on the public site: the same for everyone, asking the server for nothing', async ({
      page,
      baseURL,
    }) => {
      const email = await signUp(page);
      const origin = originOf(baseURL);
      const requests: Request[] = [];
      page.on('request', (sent) => {
        requests.push(sent);
      });

      for (const path of ['/', '/about', '/fr', '/th/about']) {
        // oxlint-disable-next-line no-await-in-loop -- one page after the other
        const response = await page.goto(path);
        // oxlint-disable-next-line no-await-in-loop -- see above
        const cookies = (await response?.headerValue('set-cookie')) ?? '';
        // oxlint-disable-next-line no-await-in-loop -- see above
        const html = (await response?.text()) ?? '';

        expect(response?.headers()['x-nextjs-prerender'], path).toMatch(/^1\b/u);
        expect(cookies, path).not.toMatch(/_token=/u);
        expect(html, path).not.toContain(email);
      }

      expect(requests.filter((sent) => sent.method() !== 'GET').map((sent) => sent.url())).toEqual(
        [],
      );
      expect(
        requests
          .map((sent) => new URL(sent.url()))
          .filter((url) => url.origin !== origin || url.pathname.startsWith('/api/'))
          .map(String),
      ).toEqual([]);
      // No source maps for the scripts.
      const script = requests.find((sent) => sent.url().endsWith('.js'))?.url();
      expect(script).toBeDefined();
      const map = await page.request.get(`${script}.map`);
      expect(map.status()).toBe(404);
    });
  });
});

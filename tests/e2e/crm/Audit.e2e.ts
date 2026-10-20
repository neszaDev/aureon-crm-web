import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PASSWORD, signIn } from '../helpers';
import {
  addMember,
  apiCall,
  BACKEND_URL,
  COMPANY_COLUMNS,
  expectNoA11yViolations,
  seed,
  seedWorkspace,
  waitForHydration,
} from './helpers';

test.describe('Export and the audit trail', () => {
  test("downloads the filtered companies as the backend's CSV, under its name, and the trail records it", async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: 'Avery Owner' });
    await seed(request, owner, 'companies', { name: 'Beta Retail', industry: 'Retail' });
    await seed(request, owner, 'companies', { name: 'Acme Retail', industry: 'Retail' });
    await seed(request, owner, 'companies', { name: 'Gamma Energy', industry: 'Energy' });
    // What the backend itself answers for these filters: the file must reach the browser as it is.
    const direct = await request.get(
      `${BACKEND_URL}/api/v1/workspaces/${owner.workspaceId}/companies/export?industry=Retail`,
      { headers: owner.headers },
    );
    expect(direct.status()).toBe(200);
    const name = /filename="([^"]+)"/u.exec(direct.headers()['content-disposition'] ?? '')?.[1];
    expect(name).toMatch(/^companies-\d{4}-\d{2}-\d{2}\.csv$/u);
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/companies?industry=Retail&sort=CREATED_AT&size=50`);
    await expect(page.getByRole('heading', { name: '2 companies' })).toBeVisible();
    const exportButton = page.getByRole('button', { name: 'Export CSV' });
    await waitForHydration(exportButton);
    const downloading = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloading;

    expect(download.suggestedFilename()).toBe(name);
    const file = await readFile(await download.path());
    expect(file.equals(await direct.body())).toBe(true);
    // The header row, then only the Retail companies, by name (the export's own order).
    const [header, ...rows] = file.toString('utf-8').replace(/^﻿/u, '').trimEnd().split('\r\n');
    expect(header).toBe(COMPANY_COLUMNS);
    expect(rows.map((row) => row.split(',')[1])).toStrictEqual(['Acme Retail', 'Beta Retail']);
    await expect(page.getByText(`Saved ${name}`)).toBeVisible();

    // Every export is in the workspace's history: the UI's is the latest.
    await page.goto(`${owner.path}/settings/audit`);
    const latest = page
      .getByRole('region', { name: /events$/u })
      .locator(':scope > ul > li')
      .first();
    await expect(latest).toContainText('Avery Owner exported records');
    await expect(latest).toContainText('2 companies exported');
  });

  test('shows a rep neither the export nor the trail, and the route refuses them in their language', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request);
    const rep = await addMember(request, owner, 'SALES_REP', 'Riley Rep');
    await signIn(page, { email: rep.email, password: PASSWORD });

    await page.goto(`${owner.path}/companies`);
    await expect(page.getByRole('heading', { level: 1, name: 'Companies' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export CSV' })).toHaveCount(0);

    await page.goto(`${owner.path}/settings/audit`);
    await expect(
      page.getByRole('heading', { level: 1, name: "You don't have access to this" }),
    ).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Settings' }).getByRole('link', { name: 'Audit' }),
    ).toHaveCount(0);

    const refused = await page.request.get(
      `/api/crm/${owner.workspaceId}/export/companies?locale=fr`,
    );
    expect(refused.status()).toBe(403);
    expect(await refused.json()).toStrictEqual({ message: 'Votre rôle ne le permet pas.' });
  });

  test("shows an edit in the record's history, and filters the workspace's trail", async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request, { owner: 'Avery Owner' });
    const manager = await addMember(request, owner, 'MANAGER', 'Morgan Manager');
    const acme = await seed(request, owner, 'companies', { name: 'Acme' });
    await seed(request, manager, 'leads', { firstName: 'Noa', lastName: 'Park' });
    await signIn(page, { email: owner.email, password: PASSWORD });

    await page.goto(`${owner.path}/companies/${acme.id}/edit`);
    await waitForHydration(page.locator('form'));
    await page.getByLabel('Company name').fill('Acme Trading');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Saved', { exact: true })).toBeVisible();

    await page.goto(`${owner.path}/companies/${acme.id}`);
    const history = page.getByRole('region', { name: /^History/u });
    const events = history.locator(':scope > ul > li');
    await expect(events).toHaveCount(2);
    await expect(events.first()).toContainText('Avery Owner changed Acme Trading');
    await expect(events.first()).toContainText('Name: Acme → Acme Trading');
    await expect(events.nth(1)).toContainText('Avery Owner created Acme');

    await page.goto(`${owner.path}/settings/workspace`);
    await page
      .getByRole('navigation', { name: 'Settings' })
      .getByRole('link', { name: 'Audit' })
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'Audit' })).toBeVisible();
    const trail = page.getByRole('region', { name: /events$/u });
    await expect(trail).toContainText('Avery Owner invited');
    await expect(trail).toContainText('Morgan Manager created Noa Park');
    await expectNoA11yViolations(page);

    await page.getByRole('combobox', { name: 'Record type' }).click();
    await page.getByRole('option', { name: 'Companies' }).click();
    await expect(page).toHaveURL(/\?entityType=COMPANY$/u);
    await expect(page.getByRole('heading', { name: '2 events' })).toBeVisible();

    await page.getByRole('combobox', { name: 'Done by' }).click();
    await page.getByRole('option', { name: 'Morgan Manager' }).click();
    await expect(page).toHaveURL(
      new RegExp(`\\?entityType=COMPANY&actorId=${manager.userId}$`, 'u'),
    );
    await expect(page.getByText('Nothing matches')).toBeVisible();

    // Everything the manager did, as the backend counts it.
    const theirs = await apiCall<{ totalElements: number }>(
      request,
      owner,
      'GET',
      `/workspaces/${owner.workspaceId}/audit-events?actorId=${manager.userId}`,
    );
    await page.getByRole('combobox', { name: 'Record type' }).click();
    await page.getByRole('option', { name: 'Any type' }).click();
    await expect(page).toHaveURL(new RegExp(`\\?actorId=${manager.userId}$`, 'u'));
    await expect(
      page.getByRole('heading', { name: `${theirs.totalElements} events` }),
    ).toBeVisible();
    await expect(page.getByRole('region', { name: /events$/u })).toContainText(
      'Morgan Manager created Noa Park',
    );
  });

  test('refreshes an expired access token before the export, as a page would', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request);
    await seed(request, owner, 'companies', { name: 'Acme Retail' });
    await signIn(page, { email: owner.email, password: PASSWORD });
    await page.goto(`${owner.path}/companies`);
    const exportButton = page.getByRole('button', { name: 'Export CSV' });
    await waitForHydration(exportButton);
    // The router's prefetches first: each refreshes an expired session too, and with rotation only
    // one of several at once wins (the race the proxy accepts for pages and actions alike).
    await page.waitForLoadState('networkidle');
    // The browser dropped the access cookie as its token expired; the refresh cookie is good.
    await page.context().clearCookies({ name: 'access_token' });

    const downloading = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloading;

    expect(download.suggestedFilename()).toMatch(/^companies-\d{4}-\d{2}-\d{2}\.csv$/u);
    const cookies = await page.context().cookies();
    expect(cookies.find((cookie) => cookie.name === 'access_token')?.value).toBeTruthy();
  });

  test('ends a session the backend rejects on export, as an action does, then comes back to the list', async ({
    page,
    request,
    baseURL,
  }) => {
    const owner = await seedWorkspace(request);
    await signIn(page, { email: owner.email, password: PASSWORD });
    const list = `${owner.path}/companies?q=acme&sort=UPDATED_AT`;
    await page.goto(list);
    const exportButton = page.getByRole('button', { name: 'Export CSV' });
    await waitForHydration(exportButton);
    // The backend no longer accepts the access token.
    await page.context().addCookies([{ name: 'access_token', value: 'expired', url: baseURL }]);

    await exportButton.click();

    await expect(page).toHaveURL(`/sign-in?expired=1&next=${encodeURIComponent(list)}`);
    await expect(page.getByText('Your session has ended. Sign in again.')).toBeVisible();
    const cookies = await page.context().cookies();
    const names = cookies.map((cookie) => cookie.name);
    expect(names).not.toContain('access_token');
    expect(names).not.toContain('refresh_token');

    await page.getByLabel('Email address').fill(owner.email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(list);
  });

  test('records no export for a HEAD request or one another site started', async ({
    page,
    request,
  }) => {
    const owner = await seedWorkspace(request);
    await seed(request, owner, 'companies', { name: 'Acme Retail' });
    await signIn(page, { email: owner.email, password: PASSWORD });
    const route = `/api/crm/${owner.workspaceId}/export/companies?locale=fr`;

    // With the browser's session cookies, as a link on another site would send them.
    const head = await page.request.head(route);
    const crossSite = await page.request.get(route, {
      headers: { 'Sec-Fetch-Site': 'cross-site' },
    });

    expect(head.status()).toBe(405);
    expect(crossSite.status()).toBe(403);
    expect(await crossSite.json()).toStrictEqual({ message: 'Votre rôle ne le permet pas.' });
    // The workspace's own history: an export would be there.
    const history = await apiCall<{ content: { action: string }[] }>(
      request,
      owner,
      'GET',
      `/workspaces/${owner.workspaceId}/audit-events?entityType=WORKSPACE&size=100`,
    );
    expect(history.content.filter((event) => event.action === 'EXPORT')).toStrictEqual([]);
  });
});

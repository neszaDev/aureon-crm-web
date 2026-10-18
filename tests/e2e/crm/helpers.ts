import AxeBuilder from '@axe-core/playwright';
import type { APIRequestContext, Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { PASSWORD, uniqueEmail } from '../helpers';

export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

// WCAG 2.1 A + AA, as checked by axe-core.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Checks the page against WCAG 2.1 AA with axe, once the page has its title (Next streams it after
 * a client-side navigation or a refresh, and axe's `document-title` rule fails on the gap) and
 * menus and drawers have finished fading in.
 * @param page Playwright page.
 */
export const expectNoA11yViolations = async (page: Page) => {
  // Time-based animations only: a scroll-driven one (the deal board's edge fade) is "running" for
  // as long as the page is, and never finishes.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every(
        (animation) =>
          animation.playState !== 'running' || !(animation.timeline instanceof DocumentTimeline),
      ),
  );
  // Last, so no gap is left between the check and axe's reading of the page.
  await expect(page).not.toHaveTitle('');
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  expect(
    violations.map((violation) => ({
      rule: violation.id,
      targets: violation.nodes.map((node) => `${node.target.join(' ')}: ${node.failureSummary}`),
    })),
  ).toEqual([]);
};

/**
 * Fills and sends the workspace form (EUR, Europe/Paris) and waits for the new workspace.
 * @param page Playwright page.
 * @param name Workspace name.
 * @returns The workspace's URL.
 */
export const createWorkspace = async (page: Page, name: string) => {
  await page.getByLabel('Workspace name').fill(name);
  await page.getByLabel('Default currency').selectOption('EUR');
  await page.getByLabel('Time zone').selectOption('Europe/Paris');
  await page.getByRole('button', { name: 'Create workspace' }).click();
  await expect(page).toHaveURL(/\/app\/\d+$/u);

  return page.url();
};

/**
 * Through the API: registers an owner, creates "Acme" and invites `email` as a manager.
 * @param request Playwright API client.
 * @param email The invited email.
 * @returns The link's path and token, the workspace, the invitation, and the owner's email and
 *   headers.
 */
export const invite = async (request: APIRequestContext, email: string) => {
  const ownerEmail = uniqueEmail();
  const owner = await request.post(`${BACKEND_URL}/api/v1/auth/register`, {
    data: { email: ownerEmail, password: PASSWORD },
  });
  expect(owner.status()).toBe(201);
  const { accessToken } = await owner.json();
  const headers = { Authorization: `Bearer ${accessToken}` };
  const workspace = await request.post(`${BACKEND_URL}/api/v1/workspaces`, {
    headers,
    data: { name: 'Acme', defaultCurrency: 'EUR', timezone: 'Europe/Paris' },
  });
  expect(workspace.status()).toBe(201);
  const { id: workspaceId }: { id: number } = await workspace.json();
  const invitation = await request.post(
    `${BACKEND_URL}/api/v1/workspaces/${workspaceId}/invitations`,
    { headers, data: { email, role: 'MANAGER' } },
  );
  expect(invitation.status()).toBe(201);
  const { id, token }: { id: number; token: string } = await invitation.json();

  return { path: `/invite/${token}`, token, workspaceId, invitationId: id, ownerEmail, headers };
};

/** An account made through the API: its sign-in, its id, and the headers that act as it. */
export type ApiUser = {
  email: string;
  userId: number;
  name?: string;
  headers: { Authorization: string };
};

/** An account that belongs to a workspace made through the API. */
export type Member = ApiUser & { workspaceId: number; path: string };

/**
 * Calls the API as an account and fails the test on any error status.
 * @param request Playwright API client.
 * @param user The account whose token is sent.
 * @param method HTTP method.
 * @param path Path under `/api/v1`.
 * @param data JSON body.
 * @returns The response.
 */
export const apiSend = async (
  request: APIRequestContext,
  user: ApiUser,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  data?: unknown,
) => {
  const response = await request.fetch(`${BACKEND_URL}/api/v1${path}`, {
    method,
    headers: user.headers,
    data,
  });
  expect(response.ok(), `${method} ${path}: ${response.status()} ${await response.text()}`).toBe(
    true,
  );

  return response;
};

/**
 * Calls the API as an account, for an answer with a JSON body.
 * @param request Playwright API client.
 * @param user The account whose token is sent.
 * @param method HTTP method.
 * @param path Path under `/api/v1`.
 * @param data JSON body.
 * @returns The JSON answer, as the caller says it looks.
 */
export const apiCall = async <T>(
  request: APIRequestContext,
  user: ApiUser,
  method: 'GET' | 'POST' | 'PUT',
  path: string,
  data?: unknown,
) => {
  const response = await apiSend(request, user, method, path, data);
  const body: T = await response.json();

  return body;
};

/**
 * Registers an account through the API.
 * @param request Playwright API client.
 * @param name Its display name, which people see on seals and in history.
 * @returns The account, with the password `PASSWORD`.
 */
const registerUser = async (request: APIRequestContext, name?: string) => {
  const email = uniqueEmail();
  const registered = await request.post(`${BACKEND_URL}/api/v1/auth/register`, {
    data: { email, password: PASSWORD },
  });
  expect(registered.status()).toBe(201);
  const { accessToken } = await registered.json();
  const user: ApiUser = {
    email,
    userId: 0,
    name,
    headers: { Authorization: `Bearer ${accessToken}` },
  };
  const me = await apiCall<{ id: number }>(request, user, 'GET', '/users/me');
  if (name) {
    await apiSend(request, user, 'PUT', '/users/me', { displayName: name });
  }

  return { ...user, userId: me.id };
};

/**
 * Through the API: registers an owner and creates a workspace (EUR, Europe/Paris) for them.
 * @param request Playwright API client.
 * @param options What to call them.
 * @param options.workspace The workspace's name.
 * @param options.owner The owner's display name.
 * @returns The owner, signed in as far as the API goes, and the workspace's id and path.
 */
export const seedWorkspace = async (
  request: APIRequestContext,
  options: { workspace?: string; owner?: string } = {},
): Promise<Member> => {
  const owner = await registerUser(request, options.owner);
  const workspace = await apiCall<{ id: number }>(request, owner, 'POST', '/workspaces', {
    name: options.workspace ?? 'Acme',
    defaultCurrency: 'EUR',
    timezone: 'Europe/Paris',
  });

  return { ...owner, workspaceId: workspace.id, path: `/app/${workspace.id}` };
};

/**
 * Through the API: registers an account, invites it to the owner's workspace and accepts.
 * @param request Playwright API client.
 * @param owner The workspace's owner.
 * @param role The new member's role.
 * @param name Their display name.
 * @returns The new member.
 */
export const addMember = async (
  request: APIRequestContext,
  owner: Member,
  role: 'ADMIN' | 'MANAGER' | 'SALES_REP',
  name?: string,
): Promise<Member> => {
  const user = await registerUser(request, name);
  const invitation = await apiCall<{ token: string }>(
    request,
    owner,
    'POST',
    `/workspaces/${owner.workspaceId}/invitations`,
    { email: user.email, role },
  );
  await apiSend(request, user, 'POST', `/invitations/${invitation.token}/accept`);

  return { ...user, workspaceId: owner.workspaceId, path: owner.path };
};

/** The records the API seeds. */
type Kind = 'companies' | 'contacts' | 'leads' | 'deals' | 'tasks' | 'activities';

/**
 * Through the API: creates a record, owned by the account that makes it.
 * @param request Playwright API client.
 * @param as The member who creates it.
 * @param kind The kind of record.
 * @param data Its fields, as the API takes them.
 * @returns The record's id and version.
 */
export const seed = async (
  request: APIRequestContext,
  as: Member,
  kind: Kind,
  data: Record<string, unknown>,
) =>
  await apiCall<{ id: number; version: number }>(
    request,
    as,
    'POST',
    `/workspaces/${as.workspaceId}/${kind}`,
    data,
  );

/**
 * Through the API: the workspace's pipeline stages, in order.
 * @param request Playwright API client.
 * @param as A member.
 * @returns The stages.
 */
export const stagesOf = async (request: APIRequestContext, as: Member) =>
  await apiCall<{ id: number; name: string; kind: 'OPEN' | 'WON' | 'LOST' }[]>(
    request,
    as,
    'GET',
    `/workspaces/${as.workspaceId}/pipeline-stages`,
  );

/**
 * Waits until React has hydrated an element: before that, a field typed into is reset by its
 * form, and a click does nothing.
 * @param element An element inside what must be interactive, such as the page's form.
 */
export const waitForHydration = async (element: Locator) => {
  await expect
    .poll(
      async () =>
        await element.evaluate((node) =>
          Object.keys(node).some((key) => key.startsWith('__reactProps$')),
        ),
    )
    .toBe(true);
};

/**
 * The id at the end of a record page's URL.
 * @param page Playwright page, on a record's page.
 * @returns The record's id.
 */
const recordId = (page: Page) => Number(new URL(page.url()).pathname.split('/').at(-1));

/**
 * Through the UI: creates a company and waits for its page.
 * @param page Playwright page, signed in.
 * @param workspace The workspace's path, such as `/app/12`.
 * @param values The company's fields.
 * @param values.name Its name.
 * @param values.industry Its industry.
 * @returns The company's id.
 */
export const createCompany = async (
  page: Page,
  workspace: string,
  values: { name: string; industry?: string },
) => {
  await page.goto(`${workspace}/companies/new`);
  await waitForHydration(page.locator('form'));
  await page.getByLabel('Company name').fill(values.name);
  if (values.industry) {
    await page.getByLabel('Industry').fill(values.industry);
  }
  await page.getByRole('button', { name: 'Create company' }).click();
  await expect(page.getByRole('heading', { level: 1, name: values.name })).toBeVisible();

  return recordId(page);
};

/**
 * Through the UI: creates a contact, at a company if one is named, and waits for its page.
 * @param page Playwright page, signed in.
 * @param workspace The workspace's path.
 * @param values The contact's fields.
 * @param values.firstName First name.
 * @param values.lastName Last name.
 * @param values.email Email.
 * @param values.company The name of an existing company to link.
 * @returns The contact's id.
 */
export const createContact = async (
  page: Page,
  workspace: string,
  values: { firstName: string; lastName: string; email?: string; company?: string },
) => {
  await page.goto(`${workspace}/contacts/new`);
  await waitForHydration(page.locator('form'));
  await page.getByLabel('First name').fill(values.firstName);
  await page.getByLabel('Last name').fill(values.lastName);
  if (values.email) {
    await page.getByLabel('Email', { exact: true }).fill(values.email);
  }
  if (values.company) {
    await page.getByRole('combobox', { name: 'Company' }).click();
    await page.getByRole('option', { name: values.company }).click();
  }
  await page.getByRole('button', { name: 'Create contact' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: `${values.firstName} ${values.lastName}` }),
  ).toBeVisible();

  return recordId(page);
};

/**
 * Through the UI: creates a lead and waits for its page.
 * @param page Playwright page, signed in.
 * @param workspace The workspace's path.
 * @param values The lead's fields.
 * @param values.firstName First name.
 * @param values.lastName Last name.
 * @param values.companyName The company they work for, as text.
 * @param values.estimatedValue What the lead may be worth.
 * @returns The lead's id.
 */
export const createLead = async (
  page: Page,
  workspace: string,
  values: { firstName: string; lastName: string; companyName?: string; estimatedValue?: string },
) => {
  await page.goto(`${workspace}/leads/new`);
  await waitForHydration(page.locator('form'));
  await page.getByLabel('First name').fill(values.firstName);
  await page.getByLabel('Last name').fill(values.lastName);
  if (values.companyName) {
    await page.getByLabel('Company', { exact: true }).fill(values.companyName);
  }
  if (values.estimatedValue) {
    await page.getByLabel('Estimated value').fill(values.estimatedValue);
  }
  await page.getByRole('button', { name: 'Create lead' }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: `${values.firstName} ${values.lastName}` }),
  ).toBeVisible();

  return recordId(page);
};

/**
 * Opens a page and checks that nothing is wider than the viewport, so the page never scrolls
 * sideways.
 * @param page Playwright page, with the viewport to check.
 * @param url The page.
 */
export const expectNoSidewaysScroll = async (page: Page, url: string) => {
  await page.goto(url);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    `${url} is wider than the viewport`,
  ).toBe(true);
};

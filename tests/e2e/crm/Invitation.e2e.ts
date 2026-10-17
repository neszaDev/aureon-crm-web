import { execFileSync } from 'node:child_process';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signOut, signUp, uniqueEmail } from '../helpers';
import { BACKEND_URL, expectNoA11yViolations, invite } from './helpers';

// The backend's database, for the one state the API can't produce: an expired link. Defaults to
// the API repository's local Compose project.
const POSTGRES_CONTAINER = process.env.E2E_POSTGRES_CONTAINER ?? 'aureon-crm-api-postgres-1';

/**
 * Moves an invitation's expiry into the past, in the database (only this test's row).
 * @param id The invitation.
 */
const expireInvitation = (id: number) => {
  expect(Number.isSafeInteger(id)).toBe(true);
  execFileSync('docker', [
    'exec',
    POSTGRES_CONTAINER,
    'psql',
    '-U',
    'boilerplate',
    '-d',
    'boilerplate',
    '-c',
    `UPDATE workspace_invitations SET expires_at = now() - interval '1 minute' WHERE id = ${id}`,
  ]);
};

/**
 * Checks the role shown on the workspace dashboard.
 * @param page Playwright page, on the dashboard.
 * @param role The role's name.
 */
const expectRole = async (page: Page, role: string) => {
  await expect(page.locator('dt:has-text("Your role") + dd')).toHaveText(role);
};

/**
 * Opens a link that no longer works and checks its message.
 * @param page Playwright page.
 * @param path The link.
 * @param title The expected heading.
 */
const expectClosed = async (page: Page, path: string, title: string) => {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
};

test.describe('Invitation links', () => {
  test('creates the account through the link and opens the workspace with the role', async ({
    page,
    context,
    request,
    baseURL,
  }) => {
    const email = uniqueEmail();
    const { path, workspaceId } = await invite(request, email);

    const response = await page.goto(path);
    expect(response?.headers()['referrer-policy']).toBe('no-referrer');
    await expect(page.getByRole('heading', { level: 1, name: 'Join Acme' })).toBeVisible();
    await expect(page).toHaveTitle('Invitation');
    await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');
    await expect(page.getByText(email)).toBeVisible();
    await expectNoA11yViolations(page);

    await page.getByLabel('Display name').fill('Ana Lima');
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account and join' }).click();

    await expect(page).toHaveURL(`${baseURL}/app/${workspaceId}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Welcome to Acme' })).toBeVisible();
    await expectRole(page, 'Manager');
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === 'access_token')?.httpOnly).toBe(true);
    expect(cookies.find((cookie) => cookie.name === 'refresh_token')?.httpOnly).toBe(true);

    // A link works once.
    await expectClosed(page, path, 'This invitation has already been used');
    await page.getByRole('link', { name: 'Go to your workspaces' }).click();
    await expect(page).toHaveURL(`${baseURL}/app/${workspaceId}`);
  });

  test('joins as the invited user, even with an expired access cookie', async ({
    page,
    context,
    request,
    baseURL,
  }) => {
    const email = await signUp(page);
    const { path, workspaceId } = await invite(request, email);
    // The proxy refreshes the session on invitation pages too.
    await context.clearCookies({ name: 'access_token' });

    await page.goto(path);
    await expect(page.getByText(email)).toBeVisible();
    await expectNoA11yViolations(page);
    await page.getByRole('button', { name: 'Join Acme' }).click();

    await expect(page).toHaveURL(`${baseURL}/app/${workspaceId}`);
    await expectRole(page, 'Manager');
  });

  test('explains a link for another email and signs out back to it', async ({
    page,
    context,
    request,
    baseURL,
  }) => {
    const invited = uniqueEmail();
    const { path } = await invite(request, invited);
    const other = await signUp(page);

    await page.goto(path);
    await expect(
      page.getByRole('heading', { level: 1, name: 'This invitation is for another account' }),
    ).toBeVisible();
    await expect(page.getByText(invited)).toBeVisible();
    await expect(page.getByText(other)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Join Acme' })).toHaveCount(0);
    await expectNoA11yViolations(page);
    await page.getByRole('button', { name: 'Sign out' }).click();

    await expect(page).toHaveURL(`${baseURL}${path}`);
    await expect(page.getByRole('button', { name: 'Create account and join' })).toBeVisible();
    const cookies = await context.cookies();
    expect(cookies.filter((c) => c.name === 'access_token' || c.name === 'refresh_token')).toEqual(
      [],
    );
  });

  test('sends an existing account to sign in, then back to join', async ({
    page,
    request,
    baseURL,
  }) => {
    const email = await signUp(page);
    await signOut(page);
    const { path, workspaceId } = await invite(request, email);

    await page.goto(path);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Create account and join' }).click();
    await expect(page.locator('form').getByRole('alert')).toHaveText(
      'This email already has an account. Sign in to join.',
    );

    await page.getByRole('link', { name: 'Sign in to join' }).click();
    await expect(page).toHaveURL(`${baseURL}/sign-in?next=${encodeURIComponent(path)}`);
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(`${baseURL}${path}`);
    await page.getByRole('button', { name: 'Join Acme' }).click();
    await expect(page).toHaveURL(`${baseURL}/app/${workspaceId}`);
    await expectRole(page, 'Manager');
  });

  test('explains links that no longer work', async ({ page, request, baseURL }) => {
    const accepted = await invite(request, uniqueEmail());
    const registered = await request.post(
      `${BACKEND_URL}/api/v1/invitations/${accepted.token}/register`,
      { data: { password: PASSWORD } },
    );
    expect(registered.status()).toBe(201);
    const revoked = await invite(request, uniqueEmail());
    const revoke = await request.delete(
      `${BACKEND_URL}/api/v1/workspaces/${revoked.workspaceId}/invitations/${revoked.invitationId}`,
      { headers: revoked.headers },
    );
    expect(revoke.status()).toBe(204);
    const expired = await invite(request, uniqueEmail());
    expireInvitation(expired.invitationId);

    await expectClosed(page, accepted.path, 'This invitation has already been used');
    await expectClosed(page, revoked.path, 'This invitation was cancelled');
    await expectClosed(page, expired.path, 'This invitation has expired');
    await expect(page.getByText('Ask the person who invited you to Acme')).toBeVisible();
    await expectNoA11yViolations(page);
    await expectClosed(page, '/invite/not-a-real-token', "This invitation link doesn't work");

    await page.getByRole('main').getByRole('link', { name: 'Back to home' }).click();
    await expect(page).toHaveURL(`${baseURL}/`);
  });

  test('fits a phone in Thai', async ({ page, request }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { path } = await invite(request, uniqueEmail());

    const response = await page.goto(`/th${path}`);
    expect(response?.headers()['referrer-policy']).toBe('no-referrer');

    await expect(page.getByRole('heading', { level: 1, name: 'เข้าร่วม Acme' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'สร้างบัญชีและเข้าร่วม' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    await expectNoA11yViolations(page);
  });
});

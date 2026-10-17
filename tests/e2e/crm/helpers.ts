import AxeBuilder from '@axe-core/playwright';
import type { APIRequestContext, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { PASSWORD, uniqueEmail } from '../helpers';

export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:8080';

// WCAG 2.1 A + AA, as checked by axe-core.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Checks the page against WCAG 2.1 AA with axe, once menus and drawers have finished fading in.
 * @param page Playwright page.
 */
export const expectNoA11yViolations = async (page: Page) => {
  await page.waitForFunction(() =>
    document.getAnimations().every((animation) => animation.playState !== 'running'),
  );
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

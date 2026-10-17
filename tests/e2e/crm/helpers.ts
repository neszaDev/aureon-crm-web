import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

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

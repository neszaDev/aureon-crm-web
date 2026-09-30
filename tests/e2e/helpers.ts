import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

export const PASSWORD = 'a-secure-password';

/**
 * Every test registers its own user so tests never depend on each other or on order.
 * @returns A new, unused email address.
 */
export const uniqueEmail = () => `e2e-${randomUUID()}@example.com`;

/**
 * Registers a new account through the UI and waits for the dashboard.
 * @param page Playwright page.
 * @returns The email of the new account.
 */
export const signUp = async (page: Page) => {
  const email = uniqueEmail();
  await page.goto('/sign-up');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByText(`Hello ${email}!`)).toBeVisible();

  return email;
};

/**
 * Signs out through the UI and waits until the session cookies are gone (the action
 * finishes by redirecting home), so the next navigation is really signed out.
 * @param page Playwright page.
 */
export const signOut = async (page: Page) => {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/$/u);
};

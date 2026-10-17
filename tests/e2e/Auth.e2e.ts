import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import { PASSWORD, signOut, signUp, uniqueEmail } from './helpers';

/**
 * Registers a user, signs out, then signs in from the given sign-in URL.
 * @param page Playwright page.
 * @param url The sign-in page, with its query.
 */
const signInFrom = async (page: Page, url: string) => {
  const email = await signUp(page);
  await signOut(page);
  await page.goto(url);
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
};

test.describe('Auth', () => {
  test.describe('Protected pages', () => {
    test('redirects signed-out visitors to sign-in', async ({ page }) => {
      await page.goto('/dashboard');

      await expect(page).toHaveURL(/\/sign-in$/u);
    });

    test('redirects signed-out visitors of the CRM to sign-in', async ({ page }) => {
      await page.goto('/app');

      await expect(page).toHaveURL(/\/sign-in$/u);
    });

    test('keeps the locale when redirecting', async ({ page }) => {
      await page.goto('/fr/dashboard/test-results');

      await expect(page).toHaveURL(/\/fr\/sign-in$/u);
    });
  });

  test.describe('Sign up, sign out and sign in', () => {
    test('runs the full session lifecycle against the backend', async ({ page, context }) => {
      const email = await signUp(page);

      const cookies = await context.cookies();
      const access = cookies.find((cookie) => cookie.name === 'access_token');
      expect(access?.httpOnly).toBe(true);
      expect(cookies.find((cookie) => cookie.name === 'refresh_token')?.httpOnly).toBe(true);

      await signOut(page);
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/\/sign-in$/u);

      await page.getByLabel('Email address').fill(email.toUpperCase());
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(/\/app$/u);
      await page.goto('/dashboard');
      await expect(page.getByText(`Hello ${email}!`)).toBeVisible();
    });

    test('refreshes an expired access token without signing out', async ({ page, context }) => {
      const email = await signUp(page);
      const initial = await context.cookies();
      const before = initial.find((c) => c.name === 'refresh_token')?.value;

      // Simulate the access cookie expiring (it lives exactly as long as the JWT).
      await context.clearCookies({ name: 'access_token' });
      await page.goto('/dashboard');

      await expect(page.getByText(`Hello ${email}!`)).toBeVisible();
      const after = await context.cookies();
      expect(after.some((c) => c.name === 'access_token')).toBe(true);
      // The backend rotates refresh tokens on every use.
      expect(after.find((c) => c.name === 'refresh_token')?.value).not.toBe(before);
    });

    test('refreshes an expired access token on the CRM home', async ({ page, context }) => {
      await signUp(page);
      const initial = await context.cookies();
      const before = initial.find((c) => c.name === 'refresh_token')?.value;

      await context.clearCookies({ name: 'access_token' });
      await page.goto('/app');

      await expect(page).toHaveURL(/\/app$/u);
      const after = await context.cookies();
      expect(after.some((c) => c.name === 'access_token')).toBe(true);
      expect(after.find((c) => c.name === 'refresh_token')?.value).not.toBe(before);
    });

    test('slows down repeated failed sign-ins for one email', async ({ page }) => {
      const email = await signUp(page);
      await signOut(page);
      await page.goto('/sign-in');
      await page.getByLabel('Email address').fill(email);

      // The backend allows 10 failures per email per 15 minutes (RATE_LIMIT_LOGIN_FAILURES_PER_EMAIL).
      // One attempt after another: each must be answered before the next is sent.
      const failSignIn = async (remaining: number): Promise<void> => {
        if (remaining === 0) {
          return;
        }
        await page.getByLabel('Password').fill(`wrong-password-${remaining}`);
        await page.getByRole('button', { name: 'Sign in' }).click();
        await expect(page.locator('form').getByRole('alert')).toHaveText(
          'Invalid email or password',
        );
        await failSignIn(remaining - 1);
      };
      await failSignIn(10);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Sign in' }).click();

      await expect(page.locator('form').getByRole('alert')).toContainText(
        'Too many attempts. Try again in',
      );
    });

    test('sends signed-in users from sign-in to the CRM', async ({ page }) => {
      await signUp(page);

      await page.goto('/sign-in');

      await expect(page).toHaveURL(/\/app$/u);
    });
  });

  test.describe('Next', () => {
    // Whole URLs: `/sign-in?next=/app` itself ends in `/app`. The query proves `next` was used.
    test('follows a safe next after sign-in', async ({ page, baseURL }) => {
      await signInFrom(page, `/sign-in?next=${encodeURIComponent('/app?from=sign-in')}`);

      await expect(page).toHaveURL(`${baseURL}/app?from=sign-in`);

      // Signed in already: the proxy follows it too.
      await page.goto('/sign-in?next=/app');

      await expect(page).toHaveURL(`${baseURL}/app`);

      await page.goto(`/sign-up?next=${encodeURIComponent('/app?from=proxy')}`);

      await expect(page).toHaveURL(`${baseURL}/app?from=proxy`);
    });

    test('ignores a next that leaves the site', async ({ page, baseURL }) => {
      await signInFrom(page, '/sign-in?next=//evil.example');

      await expect(page).toHaveURL(`${baseURL}/app`);

      await page.goto('/sign-up?next=//evil.example');

      await expect(page).toHaveURL(`${baseURL}/app`);
    });
  });

  test.describe('Errors', () => {
    test('shows an error for a wrong password', async ({ page }) => {
      const email = await signUp(page);
      await signOut(page);
      await page.goto('/sign-in');

      await page.getByLabel('Email address').fill(email);
      await page.getByLabel('Password').fill('not-the-password');
      await page.getByRole('button', { name: 'Sign in' }).click();

      await expect(page.getByText('Invalid email or password')).toBeVisible();
    });

    test('shows an error for an email that is already registered', async ({ page }) => {
      const email = await signUp(page);
      await signOut(page);
      await page.goto('/sign-up');

      await page.getByLabel('Email address').fill(email);
      await page.getByLabel('Password').fill(PASSWORD);
      await page.getByRole('button', { name: 'Create account' }).click();

      await expect(page.getByText('This email is already registered')).toBeVisible();
    });

    test('validates the form before calling the backend', async ({ page }) => {
      await page.goto('/sign-up');

      await page.getByLabel('Email address').fill(uniqueEmail().replace('@', ''));
      await page.getByLabel('Password').fill('123');
      await page.getByRole('button', { name: 'Create account' }).click();

      await expect(page.getByText('Enter a valid email address')).toBeVisible();
      await expect(page.getByText('Use at least 6 characters')).toBeVisible();
    });
  });
});

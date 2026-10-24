import { expect, test } from '@playwright/test';
import { seed, seedWorkspace, waitForHydration } from './crm/helpers';
import { PASSWORD, signIn } from './helpers';
import { COMPANIES } from './mockData';

test.describe('I18n', () => {
  test.describe('Language switching', () => {
    test('switches the homepage from English to French with the dropdown', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('combobox', { name: 'Change language' }).selectOption('fr');

      await expect(
        page.getByRole('heading', {
          level: 1,
          name: "Voyez où en est chaque affaire, et qui s'en charge.",
        }),
      ).toBeVisible();
    });

    test('shows the French sign-in form under /fr', async ({ page }) => {
      await page.goto('/fr/sign-in');

      await expect(page.getByLabel('Adresse e-mail')).toBeVisible();
    });

    test('shows the Thai homepage under /th', async ({ page }) => {
      await page.goto('/th');

      await expect(
        page.getByRole('heading', {
          level: 1,
          name: 'เห็นว่าทุกดี\u2060ล\u2060อยู่\u2060ขั้น\u2060ไหน และ\u2060ใครเป็นผู้\u2060รับ\u2060ผิด\u2060ชอบ',
        }),
      ).toBeVisible();
    });
  });

  // UTC+14, where no test server's zone is: a date the browser formatted in its own zone would
  // differ from the server's HTML.
  test.describe('in a time zone far from the server', () => {
    test.use({ timezoneId: 'Pacific/Kiritimati' });

    test('renders dated pages without a hydration mismatch', async ({ page, request }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          errors.push(message.text());
        }
      });
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });
      const owner = await seedWorkspace(request);
      const company = await seed(request, owner, 'companies', { name: COMPANIES.brightwater.name });
      await seed(request, owner, 'activities', {
        type: 'CALL',
        subject: 'Intro call',
        companyId: company.id,
        occurredAt: '2026-10-18T23:30:00Z',
      });
      await seed(request, owner, 'tasks', {
        title: 'Send the quote',
        companyId: company.id,
        dueAt: new Date(Date.now() + 3_600_000).toISOString(),
      });
      await signIn(page, { email: owner.email, password: PASSWORD });

      for (const path of [
        owner.path,
        `${owner.path}/companies/${company.id}`,
        `${owner.path}/tasks`,
        '/dashboard',
      ]) {
        // oxlint-disable-next-line no-await-in-loop -- one page after the other, each hydrated
        await page.goto(path);
        // oxlint-disable-next-line no-await-in-loop -- see above
        await waitForHydration(page.getByRole('main'));
      }

      expect(errors.filter((text) => /hydrat|#418|#423|#425/iu.test(text))).toStrictEqual([]);
    });
  });
});

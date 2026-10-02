import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';
import a11yBaseline from './a11y-baseline.json' with { type: 'json' };
import { signUp } from './helpers';

// WCAG 2.1 A + AA, as checked by axe-core.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Known violations per route, to be fixed and removed from a11y-baseline.json. Any other
// violation fails the test; a listed rule that no longer occurs is reported as an annotation.
const knownViolations = (route: string): string[] =>
  Object.entries(a11yBaseline).find(([path]) => path === route)?.[1] ?? [];

// The product pages and every screen ported from the Vue admin app (docs/plans/0003-vue-ui-port.md).
const routes = [
  '/dashboard',
  '/dashboard/test-results',
  '/dashboard/files',
  '/dashboard/account',
  '/dashboard/analytics',
  '/dashboard/campus',
  '/dashboard/campus/filters',
  '/dashboard/campus/content',
  '/dashboard/campus/qr-code',
  '/dashboard/theme/colors',
  '/dashboard/theme/typography',
  ...[
    'breadcrumbs',
    'cards',
    'carousels',
    'collapses',
    'jumbotrons',
    'list-groups',
    'navs',
    'navbars',
    'paginations',
    'popovers',
    'progress-bars',
    'switches',
    'tabs',
    'tooltips',
  ].map((slug) => `/dashboard/base/${slug}`),
  ...['standard-buttons', 'button-groups', 'dropdowns', 'brand-buttons'].map(
    (slug) => `/dashboard/buttons/${slug}`,
  ),
  '/dashboard/charts',
  '/dashboard/editors/code-editors',
  '/dashboard/editors/text-editors',
  '/dashboard/forms/basic-forms',
  '/dashboard/forms/advanced-forms',
  '/dashboard/forms/validation-forms',
  '/dashboard/google-maps',
  '/dashboard/icons/coreui-icons',
  '/dashboard/icons/brands',
  '/dashboard/icons/flags',
  ...['alerts', 'badges', 'modals', 'toaster'].map((slug) => `/dashboard/notifications/${slug}`),
  '/dashboard/plugins/draggable',
  '/dashboard/plugins/calendar',
  '/dashboard/plugins/spinners',
  '/dashboard/tables/tables',
  '/dashboard/tables/advanced-tables',
  '/dashboard/widgets',
  '/dashboard/users',
  '/dashboard/users/1',
  '/dashboard/pages/404',
  '/dashboard/pages/500',
  '/dashboard/apps/invoicing/invoice',
  '/dashboard/apps/email/inbox',
  '/dashboard/apps/email/message',
  '/dashboard/apps/email/compose',
];

test.describe('Showcase screens', () => {
  // One signed-in page per worker, visited route by route; a failing route doesn't stop the rest.

  const session: { page?: Page; errors: string[] } = { errors: [] };
  const signedInPage = () => {
    if (!session.page) {
      throw new Error('beforeAll did not sign in');
    }

    return session.page;
  };

  test.beforeAll(async ({ browser }) => {
    // Reduced motion: no fade-ins half-way through when axe measures contrast.
    // (axe needs a page from an explicit context.)
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.on('pageerror', (error) => session.errors.push(`${page.url()}: ${error.message}`));
    await signUp(page);
    session.page = page;
  });

  test.afterAll(async () => {
    await session.page?.context().close();
  });

  for (const route of routes) {
    test(`renders ${route} without errors or new accessibility violations`, async () => {
      const page = signedInPage();
      session.errors.length = 0;
      const response = await page.goto(`${route}/`);

      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText('Something went wrong')).toHaveCount(0);
      expect(session.errors).toEqual([]);

      const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
      const known = knownViolations(route);
      const found = new Set(violations.map((violation) => violation.id));
      const unexpected = violations
        .filter((violation) => !known.includes(violation.id))
        .map((violation) => ({
          rule: violation.id,
          help: violation.help,
          targets: violation.nodes.map((node) => node.target.join(' ')),
        }));
      for (const fixed of known.filter((rule) => !found.has(rule))) {
        test.info().annotations.push({
          type: 'a11y-baseline',
          description: `${route}: ${fixed} no longer occurs; remove it from a11y-baseline.json`,
        });
      }

      expect(unexpected).toEqual([]);
    });
  }
});

test.describe('Showcase navigation', () => {
  test('opens a sidebar group and navigates to one of its pages', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await signUp(page);

    const nav = page.getByRole('navigation', { name: 'App navigation' });
    await nav.getByRole('button', { name: 'Base' }).click();
    await nav.getByRole('link', { name: 'Cards' }).click();

    await expect(page).toHaveURL(/\/dashboard\/base\/cards\/?$/u);
    await expect(nav.getByRole('link', { name: 'Cards' })).toHaveAttribute('aria-current', 'page');
  });
});

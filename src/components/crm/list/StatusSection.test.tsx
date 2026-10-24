// Whether what heads a section fits is the styles'.
import '@/styles/global.css';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import messages from '@/locales/en.json';
import { OwnerTitle, StatusSection } from './StatusSection';

const renderSection = async (count: number, viewAll?: { href: string; label: string }) => {
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <StatusSection
        title={<OwnerTitle />}
        count={count}
        countLabel={`${count} companies`}
        viewAll={viewAll}
      >
        <p>The rows</p>
      </StatusSection>
    </NextIntlClientProvider>,
  );

  return page.getByRole('button', { name: `Unassigned ${count} companies` });
};

describe(StatusSection, () => {
  it('keeps what heads it whole, with or without a select box before it', async () => {
    for (const select of [undefined, <input key="box" type="checkbox" aria-label="Select all" />]) {
      // oxlint-disable-next-line no-await-in-loop -- one heading after the other
      await render(
        <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
          <StatusSection
            title={
              <OwnerTitle
                member={{
                  userId: 2,
                  email: 'mia@acme.test',
                  displayName: 'Mia Manager',
                  role: 'MANAGER',
                  joinedAt: '2026-01-01T00:00:00Z',
                }}
              />
            }
            count={2}
            countLabel="2 companies"
            select={select}
          >
            <p>The rows</p>
          </StatusSection>
        </NextIntlClientProvider>,
      );
      const name = page.getByText('Mia Manager', { exact: true }).element();

      expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth);
      document.body.replaceChildren();
    }
  });

  it('collapses and expands from its heading, saying which it is', async () => {
    const toggle = await renderSection(3);

    await expect.element(page.getByRole('heading', { level: 3 })).toBeVisible();
    await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect.element(page.getByText('The rows')).toBeVisible();

    await toggle.click();
    await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect.element(page.getByText('The rows')).not.toBeInTheDocument();

    await userEvent.keyboard('{Enter}');
    await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect.element(page.getByText('The rows')).toBeVisible();
  });

  it('links to all of a group it shows only part of', async () => {
    await renderSection(51, { href: '/app/1/companies?ownerId=unassigned', label: 'View all 51' });

    await expect
      .element(page.getByRole('link', { name: 'View all 51' }))
      .toHaveAttribute('href', '/app/1/companies?ownerId=unassigned');
  });
});

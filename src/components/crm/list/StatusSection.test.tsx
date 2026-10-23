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

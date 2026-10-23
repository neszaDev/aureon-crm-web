import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import { InRecordPanel } from '@/components/crm/record/RecordPanel';
import { RecordSection } from '@/components/crm/record/RecordSection';
import { StatusPill } from '@/components/crm/StatusPill';
import messages from '@/locales/en.json';
import { RecordHeader } from './RecordHeader';

const MIA = { userId: 1, email: 'mia@acme.test', displayName: 'Mia Manager' };

const header = (props: Partial<Parameters<typeof RecordHeader>[0]>) => (
  <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
    <RecordHeader
      number="D-0042"
      name="Acme renewal"
      headingId="heading"
      archived={false}
      {...props}
    />
  </NextIntlClientProvider>
);

describe(RecordHeader, () => {
  it('names the record in its focusable heading, under its number', async () => {
    await render(header({ archived: true }));

    const heading = page.getByRole('heading', { level: 1, name: 'Acme renewal' });

    await expect.element(heading).toHaveAttribute('id', 'heading');
    await expect.element(heading).toHaveAttribute('tabindex', '-1');
    await expect.element(page.getByText('D-0042')).toBeVisible();
    await expect.element(page.getByText('Archived')).toBeVisible();
  });

  it('shows its status pill beside its owner, and its track under them', async () => {
    await render(
      header({
        owner: MIA,
        status: <StatusPill tone="amber" label="Proposal" field="Stage" />,
        track: <ol aria-label="Stage 2 of 3: Proposal" />,
      }),
    );

    await expect.element(page.getByText('Stage: Proposal')).toBeInTheDocument();
    await expect.element(page.getByText('Owned by Mia Manager')).toBeVisible();
    await expect
      .element(page.getByRole('list', { name: 'Stage 2 of 3: Proposal' }))
      .toBeInTheDocument();
  });

  it('says a task is assigned, and a record without an owner unassigned', async () => {
    const { rerender } = await render(header({ owner: MIA, assigned: true }));

    await expect.element(page.getByText('Assigned to Mia Manager')).toBeVisible();

    await rerender(header({}));

    await expect.element(page.getByText('Unassigned')).toBeVisible();
  });

  it('keeps its ids apart from the full page behind its record panel', async () => {
    // The full page of a record of the same kind, then the record panel over it.
    await render(
      <>
        {header({ name: 'Page behind', headingId: 'company-heading' })}
        <InRecordPanel value>
          {header({ name: 'In the panel', headingId: 'company-heading' })}
          <RecordSection headingId="company-deals-heading" title="Deals" count="0 deals">
            <p>No deals</p>
          </RecordSection>
        </InRecordPanel>
      </>,
    );

    await expect
      .element(page.getByRole('heading', { level: 1, name: 'In the panel' }))
      .toHaveAttribute('id', 'panel-company-heading');
    await expect
      .element(page.getByRole('heading', { level: 1, name: 'Page behind' }))
      .toHaveAttribute('id', 'company-heading');
    await expect.element(page.getByRole('region', { name: /^Deals/u })).toBeInTheDocument();
    await expect
      .element(page.getByRole('heading', { level: 2, name: /^Deals/u }))
      .toHaveAttribute('id', 'panel-company-deals-heading');
  });
});

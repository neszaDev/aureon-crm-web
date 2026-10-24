import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { components } from '@/libs/api/schema';
import { AUDIT_LIST } from '@/libs/crm/Audit';
import { parseListQuery } from '@/libs/crm/ListQuery';
import messages from '@/locales/en.json';
import { AuditTrail } from './AuditTrail';

type Event = components['schemas']['AuditEventResponse'];

const push = vi.hoisted(() => vi.fn<(href: string) => void>());
// The links stay real; only the router is the test's.
// @ts-expect-error -- only what the filters use
vi.mock(import('@/libs/I18nNavigation'), async (importOriginal) => ({
  ...(await importOriginal()),
  useRouter: () => ({ push }),
}));

const AVERY = { userId: 1, email: 'avery@acme.test', displayName: 'Avery Owner' };
const RILEY = { userId: 2, email: 'riley@acme.test', displayName: 'Riley Rep' };
const MEMBERS = [
  { ...AVERY, role: 'OWNER', joinedAt: '2026-01-01T00:00:00Z' },
  { ...RILEY, role: 'SALES_REP', joinedAt: '2026-01-02T00:00:00Z' },
] as const;
const WORKSPACE = { id: 7, timezone: 'Asia/Bangkok' };
const PATH = '/app/7/settings/audit';

const event = (id: number, extra: Partial<Event>): Event => ({
  id,
  occurredAt: '2026-10-18T13:00:00Z',
  actor: AVERY,
  action: 'UPDATE',
  entityType: 'COMPANY',
  entityId: 42,
  changes: {},
  ...extra,
});

// The workspace's own events, which no record page shows: each reads as a sentence.
const EVENTS = [
  event(5, {
    action: 'INVITE',
    entityType: 'INVITATION',
    entityId: 3,
    entityLabel: 'sam@acme.test',
  }),
  event(4, {
    action: 'ROLE_CHANGE',
    entityType: 'MEMBER',
    entityId: 2,
    entityLabel: 'Riley Rep',
    changes: { role: { from: 'SALES_REP', to: 'MANAGER' } },
  }),
  event(3, {
    entityType: 'PIPELINE_STAGE',
    entityId: 9,
    entityLabel: 'Proposal',
    changes: { probability: { from: 40, to: 50 } },
  }),
  event(2, { action: 'CREATE', entityType: 'LEAD_SOURCE', entityId: 4, entityLabel: 'Trade show' }),
  event(1, {
    action: 'EXPORT',
    entityType: 'WORKSPACE',
    entityId: 7,
    entityLabel: '12 contacts exported',
    changes: { list: { from: null, to: 'contacts' } },
  }),
];

const pageOf = (content: Event[], totalElements = content.length) => ({
  content,
  totalElements,
  totalPages: Math.ceil(totalElements / 20),
  number: 0,
  size: 20,
  first: true,
  last: totalElements <= 20,
  empty: content.length === 0,
});

const renderTrail = async (
  events: ReturnType<typeof pageOf> | undefined,
  search: Record<string, string> = {},
) =>
  await render(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <AuditTrail
        events={events}
        workspace={WORKSPACE}
        members={[...MEMBERS]}
        path={PATH}
        query={parseListQuery(AUDIT_LIST, search)}
      />
    </NextIntlClientProvider>,
  );

// What each event says, in the order shown.
const sentences = () =>
  page
    .getByRole('listitem')
    .elements()
    .filter((node) => node.parentElement?.closest('li') === null)
    .map((node) => node.querySelector('p')?.textContent);

describe(AuditTrail, () => {
  it("lists the workspace's events as sentences, newest first, under their count", async () => {
    await renderTrail(pageOf(EVENTS, 45));

    await expect.element(page.getByRole('heading', { name: '45 events' })).toBeVisible();
    expect(sentences()).toStrictEqual([
      'Avery Owner invited sam@acme.test',
      'Avery Owner changed the role of Riley Rep',
      'Avery Owner changed Proposal',
      'Avery Owner created Trade show',
      'Avery Owner exported records',
    ]);
    await expect.element(page.getByText('Role: Sales rep → Manager')).toBeVisible();
    // The exported list in the page's words, not the event's English label.
    await expect.element(page.getByText('List: Contacts')).toBeVisible();
    // Paged like the other lists.
    await expect.element(page.getByText('1–20 of 45')).toBeVisible();
  });

  it('filters by the kind of record, keeping the other filters in the URL', async () => {
    await renderTrail(pageOf(EVENTS), { actorId: '2' });
    // A chip, off: any type.
    const type = page.getByRole('button', { name: 'Record type', exact: true });
    await expect.element(type).toBeVisible();

    await type.click();
    await page.getByRole('option', { name: 'Pipeline stages' }).click();

    expect(push).toHaveBeenLastCalledWith(`${PATH}?actorId=2&entityType=PIPELINE_STAGE`, {
      scroll: false,
    });
  });

  it("filters by who did it, among the members; someone who left reads 'Former member'", async () => {
    await renderTrail(pageOf(EVENTS), { entityType: 'MEMBER', actorId: '99' });

    await expect.element(page.getByRole('button', { name: 'Record type: Members' })).toBeVisible();
    const actor = page.getByRole('button', { name: 'Done by: Former member' });
    await expect.element(actor).toBeVisible();

    await actor.click();
    await page.getByRole('option', { name: 'Riley Rep' }).click();

    expect(push).toHaveBeenLastCalledWith(`${PATH}?entityType=MEMBER&actorId=2`, {
      scroll: false,
    });
  });

  it('says nothing was recorded yet, or that nothing matches the filters', async () => {
    const empty = await renderTrail(pageOf([]));
    await expect.element(page.getByText('Nothing recorded yet')).toBeVisible();
    await empty.unmount();

    await renderTrail(pageOf([]), { entityType: 'DEAL' });
    await expect.element(page.getByText('Nothing matches')).toBeVisible();
    await expect
      .element(page.getByRole('link', { name: 'Clear filters' }))
      .toHaveAttribute('href', PATH);
  });

  it('offers the trail without its filters when the backend refuses them', async () => {
    await renderTrail(undefined, { entityType: 'DEAL' });

    await expect
      .element(page.getByRole('link', { name: messages.RecordList.invalid_reset }))
      .toHaveAttribute('href', PATH);
  });
});

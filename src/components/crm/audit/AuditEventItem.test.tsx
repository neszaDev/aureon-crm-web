import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { page } from 'vitest/browser';
import type { components } from '@/libs/api/schema';
import en from '@/locales/en.json';
import fr from '@/locales/fr.json';
import { AuditEventItem } from './AuditEventItem';

type Event = components['schemas']['AuditEventResponse'];

const RILEY = { userId: 2, email: 'riley@acme.test', displayName: 'Riley Rep' };
const AVERY = { userId: 1, email: 'avery@acme.test', displayName: 'Avery Owner' };
// 13:00 UTC is 20:00 in Bangkok.
const WORKSPACE = { id: 7, timezone: 'Asia/Bangkok' };

const event = (extra: Partial<Event>): Event => ({
  id: 1,
  occurredAt: '2026-10-18T13:00:00Z',
  actor: RILEY,
  action: 'UPDATE',
  entityType: 'COMPANY',
  entityId: 42,
  entityLabel: 'Acme Trading',
  changes: {},
  ...extra,
});

const item = async (
  value: Event,
  options: { compact?: boolean; ownPage?: boolean; locale?: 'en' | 'fr' } = {},
) =>
  await render(
    <NextIntlClientProvider
      locale={options.locale ?? 'en'}
      messages={options.locale === 'fr' ? fr : en}
      timeZone="UTC"
    >
      <ul>
        <AuditEventItem
          event={value}
          workspace={WORKSPACE}
          compact={options.compact}
          ownPage={options.ownPage}
        />
      </ul>
    </NextIntlClientProvider>,
  );

// What each changed field says, in order.
const lines = () =>
  page
    .getByRole('list')
    .nth(1)
    .getByRole('listitem')
    .elements()
    .map((line) => line.textContent);

// The entry's sentence: who did what.
const sentence = () => page.getByRole('listitem').first().element().querySelector('p')?.textContent;

describe(AuditEventItem, () => {
  it('says who changed what, when in the workspace zone, with the record as a link', async () => {
    await item(
      event({
        entityLabel: 'Acme Trading Co',
        changes: { name: { from: 'Acme Trading', to: 'Acme Trading Co' } },
      }),
    );

    await expect.element(page.getByText('Riley Rep', { exact: true })).toBeVisible();
    const phrase = page.getByRole('listitem').first();
    await expect.element(phrase).toHaveTextContent('Riley Rep changed Acme Trading Co');
    await expect
      .element(page.getByRole('link', { name: 'Acme Trading Co' }))
      .toHaveAttribute('href', '/app/7/companies/42');
    await expect.element(page.getByText('C-0042')).toBeVisible();
    // The actor shows with their own avatar.
    await expect.element(page.getByText('RR', { exact: true })).toBeInTheDocument();
    const time = page.getByRole('time').element();
    expect(time.getAttribute('datetime')).toBe('2026-10-18T13:00:00Z');
    expect(time.textContent).toMatch(/^Oct 18, 2026, 8:00\sPM$/u);
  });

  it('writes an UPDATE as "Field: from → to", each value formatted by what it is', async () => {
    await item(
      event({
        entityType: 'DEAL',
        entityId: 9,
        entityLabel: 'Renewal',
        changes: {
          name: { from: 'Renewal', to: 'Renewal 2027' },
          expectedCloseDate: { from: '2026-10-01', to: '2026-10-31' },
          owner: { from: AVERY, to: RILEY },
          employeeCount: { from: 10, to: 1200 },
          source: { from: null, to: { id: 3, name: 'Referral' } },
          tags: { from: ['vip'], to: ['vip', 'late'] },
          notes: { from: 'first', to: null },
        },
      }),
    );

    expect(lines()).toStrictEqual([
      'Deal name: Renewal → Renewal 2027',
      'Expected close: Oct 1, 2026 → Oct 31, 2026',
      'Owner: Avery Owner → Riley Rep',
      'Employees: 10 → 1,200',
      'Source: none → Referral',
      'Tags: vip → vip, late',
      'Notes: first → none',
    ]);
  });

  it('shows money with its currency when the event names it, and as a plain amount when not', async () => {
    await item(
      event({
        entityType: 'DEAL',
        entityId: 9,
        changes: {
          amount: { from: '1000.00', to: '1250.50' },
          currency: { from: 'USD', to: 'EUR' },
        },
      }),
    );

    // The amounts are in the currencies that went with them.
    expect(lines()).toStrictEqual(['Amount: $1,000.00 → €1,250.50', 'Currency: USD → EUR']);
  });

  it('never guesses a currency the event does not carry', async () => {
    await item(
      event({
        entityType: 'DEAL',
        entityId: 9,
        changes: { amount: { from: '1000.00', to: '1250.50' } },
      }),
    );

    expect(lines()).toStrictEqual(['Amount: 1,000.00 → 1,250.50']);
  });

  it('shows instants in the workspace zone and enum values translated', async () => {
    await item(
      event({
        action: 'COMPLETE',
        entityType: 'TASK',
        entityId: 5,
        entityLabel: 'Send the proposal',
        changes: {
          status: { from: 'OPEN', to: 'COMPLETED' },
          completedAt: { to: '2026-10-18T13:00:00Z' },
          dueAt: { from: '2026-10-20T02:00:00Z', to: null },
          priority: { from: 'LOW', to: 'HIGH' },
        },
      }),
    );

    await expect
      .element(page.getByRole('listitem').first())
      .toHaveTextContent('Riley Rep completed Send the proposal');
    expect(lines().map((line) => line?.replaceAll(/\s/gu, ' '))).toStrictEqual([
      'Status: Open → Completed',
      'Completed: none → Oct 18, 2026, 8:00 PM',
      'Due: Oct 20, 2026, 9:00 AM → none',
      'Priority: Low → High',
    ]);
  });

  it('writes a stage move and a status change with the words of the stage and the status', async () => {
    await item(
      event({
        action: 'STAGE_CHANGE',
        entityType: 'DEAL',
        entityId: 9,
        entityLabel: 'Renewal',
        changes: { stage: { from: 'Negotiation', to: 'Won' }, status: { from: 'OPEN', to: 'WON' } },
      }),
    );

    await expect
      .element(page.getByRole('listitem').first())
      .toHaveTextContent('Riley Rep moved Renewal');
    expect(lines()).toStrictEqual(['Stage: Negotiation → Won', 'Status: Open → Won']);
  });

  it('shows an id as "changed", and a field without a label in sentence case', async () => {
    await item(
      event({
        changes: { companyId: { from: 1, to: 2 }, mainContactPerson: { from: 'a', to: 'b' } },
      }),
    );

    expect(lines()).toStrictEqual(['Company id: changed', 'Main contact person: a → b']);
  });

  it('cuts a long text short, whole characters only, so a note never floods the list', async () => {
    // A Thai word is a letter with marks stacked on it: the cut keeps them together.
    const long = 'ก็'.repeat(100);
    await item(event({ changes: { notes: { from: long, to: 'short' } } }));

    const [line] = lines();
    expect(line).toBe(`Notes: ${'ก็'.repeat(79)}… → short`);
  });

  it("names the record without a link or its number on the record's own page", async () => {
    await item(event({ entityLabel: 'Acme Trading Co' }), { ownPage: true });

    await expect
      .element(page.getByRole('listitem').first())
      .toHaveTextContent('Riley Rep changed Acme Trading Co');
    // The page's header already numbers it, and a link would lead to this very page.
    expect(page.getByRole('link').elements()).toHaveLength(0);
    expect(page.getByText('C-0042').elements()).toHaveLength(0);
  });

  it('cuts a long name of a member, a record or the history entry itself, as it cuts a text', async () => {
    const long = 'N'.repeat(100);
    await item(
      event({
        entityLabel: long,
        changes: {
          owner: { from: { userId: 1, email: 'a@x.test', displayName: long }, to: RILEY },
        },
      }),
    );

    const cut = `${'N'.repeat(79)}…`;
    await expect.element(page.getByRole('link', { name: cut })).toBeVisible();
    expect(lines()).toStrictEqual([`Owner: ${cut} → Riley Rep`]);
  });

  it('says the kind of a pipeline stage in words, not as stored', async () => {
    await item(
      event({
        entityType: 'PIPELINE_STAGE',
        entityId: 4,
        entityLabel: 'Negotiation',
        changes: { kind: { from: 'OPEN', to: 'WON' } },
      }),
    );

    expect(lines()).toStrictEqual(['Kind: Open → Won']);
  });

  it('shows what a DELETE removed: the last state, as it was', async () => {
    await item(
      event({
        action: 'DELETE',
        entityType: 'ACTIVITY',
        entityId: 451,
        entityLabel: 'Site visit',
        changes: {
          subject: { from: 'Site visit', to: null },
          type: { from: 'MEETING', to: null },
          occurredAt: { from: '2026-10-17T03:00:00Z', to: null },
          body: { from: null, to: null },
          id: { from: 451, to: null },
        },
      }),
    );

    await expect
      .element(page.getByRole('listitem').first())
      .toHaveTextContent('Riley Rep deleted Site visit');
    // The record is gone: no link to it.
    expect(page.getByRole('link').elements()).toHaveLength(0);
    expect(lines().map((line) => line?.replaceAll(/\s/gu, ' '))).toStrictEqual([
      'Subject: Site visit',
      'Type: Meeting',
      'When: Oct 17, 2026, 10:00 AM',
    ]);
  });

  // An export as the API records it (api.md, Export): its label is a sentence in English.
  const EXPORTED = event({
    action: 'EXPORT',
    entityType: 'WORKSPACE',
    entityId: 7,
    entityLabel: '12 contacts exported',
    changes: { list: { from: null, to: 'contacts' }, filters: { from: null, to: { q: 'a' } } },
  });

  it("names an export's list in the page language, not by the API's English label", async () => {
    const english = await item(EXPORTED);

    await expect
      .element(page.getByRole('listitem').first())
      .toHaveTextContent('Riley Rep exported records');
    expect(lines()).toStrictEqual(['List: Contacts']);
    expect(page.getByText('12 contacts exported').elements()).toHaveLength(0);
    expect(page.getByRole('link').elements()).toHaveLength(0);
    await english.unmount();

    await item(EXPORTED, { locale: 'fr' });
    expect(lines().map((line) => line?.replaceAll(/\s/gu, ' '))).toStrictEqual([
      'Liste : Contacts',
    ]);
  });

  it('says how many rows an export held when the event counts them, in the page language', async () => {
    // Exports the API recorded since it began counting them in the changes.
    const counted = (count: number) =>
      event({ ...EXPORTED, changes: { ...EXPORTED.changes, count: { from: null, to: count } } });
    const english = await item(counted(1250));

    expect(lines()).toStrictEqual(['List: Contacts (1,250 rows)']);
    await english.unmount();

    const one = await item(counted(1));
    expect(lines()).toStrictEqual(['List: Contacts (1 row)']);
    await one.unmount();

    await item(counted(12), { locale: 'fr' });
    expect(lines().map((line) => line?.replaceAll(/\s/gu, ' '))).toStrictEqual([
      'Liste : Contacts (12 lignes)',
    ]);
  });

  it('holds an export to the compact form as any entry, and keeps a cut name whole in its title', async () => {
    const long = 'N'.repeat(100);
    await item(
      { ...EXPORTED, actor: { userId: 2, email: 'n@acme.test', displayName: long } },
      { compact: true },
    );

    expect(
      page
        .getByRole('list')
        .nth(1)
        .getByRole('listitem')
        .elements()
        .map((line) => line.classList.contains('line-clamp-2')),
    ).toStrictEqual([true]);
    await expect
      .element(page.getByText(`${'N'.repeat(79)}…`, { exact: true }))
      .toHaveAttribute('title', long);
  });

  // A member joining or leaving, as the API records it: on the member, labelled with their own
  // email (InvitationService.join, MemberService.remove).
  it('says a member joined the workspace, not their own email, and the role they joined as', async () => {
    const english = await item(
      event({
        action: 'JOIN',
        entityType: 'MEMBER',
        entityId: 2,
        entityLabel: RILEY.email,
        changes: { role: { from: null, to: 'SALES_REP' } },
      }),
    );

    expect(sentence()).toBe('Riley Rep joined the workspace');
    expect(lines()).toStrictEqual(['Role: none → Sales rep']);
    await english.unmount();

    await item(
      event({ action: 'JOIN', entityType: 'MEMBER', entityId: 2, entityLabel: RILEY.email }),
      { locale: 'fr' },
    );
    expect(sentence()).toBe("Riley Rep a rejoint l'espace de travail");
  });

  it('says a member left the workspace, named once by email when they have no name', async () => {
    await item(
      event({
        action: 'LEAVE',
        entityType: 'MEMBER',
        entityId: 2,
        actor: { userId: 2, email: RILEY.email },
        entityLabel: RILEY.email,
        changes: {},
      }),
    );

    expect(sentence()).toBe('riley@acme.test left the workspace');
  });

  it('writes a date only for a date field, and a probability as a percentage', async () => {
    await item(
      event({
        entityType: 'DEAL',
        entityId: 9,
        entityLabel: 'Renewal',
        changes: {
          // Text that only looks like a date or an instant stays as it was typed.
          name: { from: '2026-10-01', to: '2026-10-18T13:00:00Z' },
          expectedCloseDate: { from: '2026-10-01', to: '2026-10-31' },
          probability: { from: 50, to: 75 },
          probabilityOverride: { from: null, to: 60 },
        },
      }),
    );

    expect(lines()).toStrictEqual([
      'Deal name: 2026-10-01 → 2026-10-18T13:00:00Z',
      'Expected close: Oct 1, 2026 → Oct 31, 2026',
      'Probability: 50% → 75%',
      'Probability override: none → 60%',
    ]);
  });

  it('names a member who left, without an avatar, and a person by email when they have no name', async () => {
    const former = await item(event({ actor: undefined, changes: {} }));

    await expect
      .element(page.getByRole('listitem').first())
      .toHaveTextContent('Former member changed Acme Trading');
    // No one's avatar.
    expect(page.getByText('FM', { exact: true }).elements()).toHaveLength(0);
    await former.unmount();

    await item(event({ actor: { userId: 9, email: 'gone@acme.test' } }));
    await expect
      .element(page.getByRole('listitem').first())
      .toHaveTextContent('gone@acme.test changed Acme Trading');
  });

  it.each([
    ['COMPANY', 'companies'],
    ['CONTACT', 'contacts'],
    ['LEAD', 'leads'],
    ['DEAL', 'deals'],
    ['TASK', 'tasks'],
  ] as const)('links a %s to its page', async (entityType, path) => {
    await item(event({ entityType, entityId: 3, entityLabel: 'Thing' }));

    await expect
      .element(page.getByRole('link', { name: 'Thing' }))
      .toHaveAttribute('href', `/app/7/${path}/3`);
  });

  it('names a record without a label by its kind', async () => {
    await item(event({ entityType: 'PIPELINE_STAGE', entityId: 3, entityLabel: undefined }));

    await expect
      .element(page.getByRole('listitem').first())
      .toHaveTextContent('Riley Rep changed a pipeline stage');
  });

  it('keeps the compact form to two fields and counts the rest', async () => {
    await item(
      event({
        changes: {
          name: { from: 'a', to: 'b' },
          phone: { from: '1', to: '2' },
          industry: { from: 'x', to: 'y' },
          website: { from: 'p', to: 'q' },
        },
      }),
      { compact: true },
    );

    expect(lines()).toStrictEqual(['Name: a → b', 'Phone: 1 → 2']);
    await expect.element(page.getByText('and 2 more changes')).toBeVisible();
    // A long value can't push the list: each line is held to two.
    expect(
      page
        .getByRole('list')
        .nth(1)
        .getByRole('listitem')
        .elements()
        .map((line) => line.classList.contains('line-clamp-2')),
    ).toStrictEqual([true, true]);
  });

  it('writes the phrase in the page language', async () => {
    await item(event({}), { locale: 'fr' });

    await expect
      .element(page.getByRole('listitem').first())
      .toHaveTextContent('Riley Rep a modifié Acme Trading');
  });
});

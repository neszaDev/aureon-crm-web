import { describe, expect, it, vi } from 'vitest';
import { getCompany, getContacts } from '@/libs/api/CrmQueries';
import { endRejectedSession } from '@/libs/api/Session';
import ContactsPage from './page';

vi.mock(import('server-only'), () => ({}));
// @ts-expect-error -- a translator that gives the key back
vi.mock(import('next-intl/server'), () => ({
  getTranslations: async () => await Promise.resolve((key: string) => key),
  setRequestLocale: vi.fn<() => void>(),
}));
// @ts-expect-error -- stand-ins for only what the page reads
vi.mock(import('@/libs/api/CrmQueries'), () => ({
  CONTACT_LIST: {
    sorts: ['NAME'],
    defaultSort: 'NAME',
    filters: { companyId: 'id', ownerId: 'id' },
    groups: ['owner'],
  },
  getCompany: vi.fn<typeof getCompany>(),
  getContacts: vi.fn<typeof getContacts>(),
  getMembers: async () =>
    await Promise.resolve({
      members: [
        { userId: 1, email: 'mia@acme.test' },
        { userId: 2, email: 'owen@acme.test' },
      ],
    }),
  getLeadSources: async () => await Promise.resolve({ sources: [] }),
  getContactTags: async () => await Promise.resolve({ tags: [] }),
}));
// @ts-expect-error -- only what the page reads
vi.mock(import('@/libs/api/Queries'), () => ({
  getCurrentUser: async () => await Promise.resolve({ user: { id: 1, email: 'mia@acme.test' } }),
}));
// @ts-expect-error -- only what the page reads
vi.mock(import('@/libs/crm/OpenWorkspace'), () => ({
  getOpenWorkspace: async () =>
    await Promise.resolve({ workspace: { id: 1, timezone: 'UTC', permissions: [] } }),
}));
vi.mock(import('@/libs/api/Session'), () => ({
  // @ts-expect-error -- the real one redirects; this one says it was asked to
  endRejectedSession: vi.fn<typeof endRejectedSession>(() => 'session ended'),
}));
// Their real modules need Next's runtime.
// @ts-expect-error -- a stand-in link
vi.mock(import('@/libs/I18nNavigation'), () => ({ Link: () => null }));
vi.mock(import('@/libs/crm/PageMetadata'), () => ({}));
vi.mock(import('@/actions/crm/RecordSearchActions'), () => ({}));

const FLAGS = { unauthorized: false, forbidden: false, notFound: false, invalid: false };

describe(ContactsPage, () => {
  it('ends the session when the company filter lookup is refused as signed out', async () => {
    // @ts-expect-error -- only what the page reads
    vi.mocked(getContacts).mockResolvedValue({ ...FLAGS, contacts: { content: [] } });
    vi.mocked(getCompany).mockResolvedValue({ ...FLAGS, company: undefined, unauthorized: true });

    const rendered = await ContactsPage({
      params: Promise.resolve({ locale: 'th', workspaceId: '1' }),
      searchParams: Promise.resolve({ companyId: '7' }),
    });

    expect(endRejectedSession).toHaveBeenCalledWith('th');
    expect(rendered).toBe('session ended');
  });
});

describe('ContactsPage grouped by owner', () => {
  it('reads each group on its own, from its first row, at most 50 of them', async () => {
    vi.mocked(getContacts).mockReset();
    vi.mocked(getContacts).mockResolvedValue({
      ...FLAGS,
      // @ts-expect-error -- only what the page reads
      contacts: { content: [], totalElements: 0, totalPages: 0 },
    });

    await ContactsPage({
      params: Promise.resolve({ locale: 'en', workspaceId: '1' }),
      searchParams: Promise.resolve({ group: 'owner', page: '4', q: 'acme' }),
    });

    const queries = vi.mocked(getContacts).mock.calls.map(([, query]) => query);
    // The caller (Mia) first, then Owen, then Unassigned: no ungrouped read.
    expect(queries.map((query) => [query.filters.ownerId, query.unassigned])).toStrictEqual([
      [1, undefined],
      [2, undefined],
      [undefined, true],
    ]);
    expect(
      queries.every((query) => query.page === 0 && query.size === 50 && query.q === 'acme'),
    ).toBeTruthy();
  });
});

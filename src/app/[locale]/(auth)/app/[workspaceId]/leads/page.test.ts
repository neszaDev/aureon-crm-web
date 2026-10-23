import { describe, expect, it, vi } from 'vitest';
import { getLeads } from '@/libs/api/CrmQueries';
import LeadsPage from './page';

vi.mock(import('server-only'), () => ({}));
// @ts-expect-error -- a translator that gives the key back
vi.mock(import('next-intl/server'), () => ({
  getTranslations: async () => await Promise.resolve((key: string) => key),
  setRequestLocale: vi.fn<() => void>(),
}));
// @ts-expect-error -- stand-ins for only what the page reads
vi.mock(import('@/libs/api/CrmQueries'), () => ({
  LEAD_LIST: {
    sorts: ['CREATED_AT'],
    defaultSort: 'CREATED_AT',
    filters: {
      status: {
        enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED', 'CONVERTED'],
        multiple: true,
      },
      ownerId: 'id',
    },
    groups: ['status', 'owner'],
    defaultGroup: 'status',
  },
  getLeads: vi.fn<typeof getLeads>(),
  getMembers: async () =>
    await Promise.resolve({ members: [{ userId: 1, email: 'mia@acme.test' }] }),
  getLeadSources: async () => await Promise.resolve({ sources: [] }),
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
vi.mock(import('@/libs/api/Session'), () => ({}));
// Their real modules need Next's runtime.
// @ts-expect-error -- a stand-in link
vi.mock(import('@/libs/I18nNavigation'), () => ({ Link: () => null }));
vi.mock(import('@/libs/crm/PageMetadata'), () => ({}));
vi.mock(import('@/actions/crm/LeadActions'), () => ({}));

const FLAGS = { unauthorized: false, forbidden: false, notFound: false, invalid: false };

describe('LeadsPage grouped by status', () => {
  it('reads each status the filter keeps on its own, from its first row, at most 50 of them', async () => {
    vi.mocked(getLeads).mockResolvedValue({
      ...FLAGS,
      // @ts-expect-error -- only what the page reads
      leads: { content: [], totalElements: 0, totalPages: 0 },
    });

    await LeadsPage({
      params: Promise.resolve({ locale: 'en', workspaceId: '1' }),
      searchParams: Promise.resolve({ status: ['QUALIFIED', 'NEW'], page: '3', q: 'acme' }),
    });

    const queries = vi.mocked(getLeads).mock.calls.map(([, query]) => query);
    // In the statuses' own order, and no ungrouped read.
    expect(queries.map((query) => query.filters.status)).toStrictEqual([['NEW'], ['QUALIFIED']]);
    expect(
      queries.every((query) => query.page === 0 && query.size === 50 && query.q === 'acme'),
    ).toBeTruthy();
  });
});

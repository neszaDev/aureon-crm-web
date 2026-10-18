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
  CONTACT_LIST: { sorts: ['NAME'], defaultSort: 'NAME', filters: { companyId: 'id' } },
  getCompany: vi.fn<typeof getCompany>(),
  getContacts: vi.fn<typeof getContacts>(),
  getMembers: async () => await Promise.resolve({ members: [] }),
  getLeadSources: async () => await Promise.resolve({ sources: [] }),
  getContactTags: async () => await Promise.resolve({ tags: [] }),
}));
// @ts-expect-error -- only what the page reads
vi.mock(import('@/libs/api/Queries'), () => ({
  getCurrentUser: async () => await Promise.resolve({ user: { id: 1, email: 'mia@acme.test' } }),
}));
// @ts-expect-error -- only what the page reads
vi.mock(import('@/libs/crm/OpenWorkspace'), () => ({
  getOpenWorkspace: async () => await Promise.resolve({ workspace: { id: 1, timezone: 'UTC' } }),
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

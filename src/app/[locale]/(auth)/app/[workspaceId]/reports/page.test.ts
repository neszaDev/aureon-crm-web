import { isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { OwnerFilter } from '@/components/crm/list/OwnerFilter';
import { PeriodPicker } from '@/components/crm/PeriodPicker';
import { ReportTabs } from '@/components/crm/reports/ReportTabs';
import { getPipelineReport, getWonLostReport } from '@/libs/api/CrmQueries';
import ReportsPage from './page';

vi.mock(import('server-only'), () => ({}));
// @ts-expect-error -- a translator that gives the key back
vi.mock(import('next-intl/server'), () => ({
  getTranslations: async () => await Promise.resolve((key: string) => key),
  setRequestLocale: vi.fn<() => void>(),
}));
// @ts-expect-error -- stand-ins for only what the page reads
vi.mock(import('@/libs/api/CrmQueries'), () => ({
  getMembers: async () =>
    await Promise.resolve({
      members: [
        { userId: 1, email: 'mia@acme.test' },
        { userId: 2, email: 'riley@acme.test' },
      ],
    }),
  getPipelineReport: vi.fn<typeof getPipelineReport>(),
  getWonLostReport: vi.fn<typeof getWonLostReport>(),
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
vi.mock(import('@/libs/I18nNavigation'), () => ({}));
vi.mock(import('@/libs/crm/PageMetadata'), () => ({}));

const FLAGS = { unauthorized: false, forbidden: false, notFound: false, invalid: false };
const params = Promise.resolve({ locale: 'en', workspaceId: '1' });

// The props of every element of a component in the page's tree, a child's or a prop's (`tabs`).
const propsOf = (node: unknown, type: unknown): unknown[] => {
  if (Array.isArray(node)) {
    return node.flatMap((child) => propsOf(child, type));
  }
  if (!isValidElement<Record<string, unknown>>(node)) {
    return [];
  }

  return [
    ...(node.type === type ? [node.props] : []),
    ...Object.values(node.props).flatMap((value) => propsOf(value, type)),
  ];
};

describe(ReportsPage, () => {
  it("asks for the workspace's report, without the owner, for an id that is no member", async () => {
    vi.mocked(getWonLostReport).mockResolvedValue({
      ...FLAGS,
      report: { period: { from: '2026-09-25', to: '2026-10-24' }, months: [] },
    });

    const page = await ReportsPage({
      params,
      searchParams: Promise.resolve({ tab: 'won-lost', ownerId: '7' }),
    });

    // No request the API would refuse: one read, of the whole workspace.
    expect(vi.mocked(getWonLostReport).mock.calls.map(([, query]) => query.ownerId)).toStrictEqual([
      undefined,
    ]);
    expect(propsOf(page, InvalidFilterNotice)).toStrictEqual([
      expect.objectContaining({
        resetHref: '/app/1/reports?tab=won-lost',
        messages: expect.objectContaining({ title: 'owner_invalid_title' }),
      }),
    ]);
    // The chip, the tabs and the period carry the owner no further: the notice says why.
    expect(propsOf(page, OwnerFilter)).toStrictEqual([
      expect.objectContaining({ query: { params: { tab: 'won-lost' } } }),
    ]);
    expect(propsOf(page, ReportTabs)).toStrictEqual([
      expect.objectContaining({ ownerId: undefined }),
    ]);
    expect(propsOf(page, PeriodPicker)).toStrictEqual([
      expect.objectContaining({ params: { tab: 'won-lost' } }),
    ]);
  });

  it('shows the plain notice, not the owner one, when the API refuses a member owner', async () => {
    vi.mocked(getPipelineReport).mockResolvedValue({ ...FLAGS, invalid: true, report: undefined });

    const page = await ReportsPage({
      params,
      searchParams: Promise.resolve({ tab: 'pipeline', ownerId: '2' }),
    });

    expect(vi.mocked(getPipelineReport).mock.calls.map(([, query]) => query.ownerId)).toStrictEqual(
      [2],
    );
    expect(propsOf(page, InvalidFilterNotice)).toStrictEqual([
      { resetHref: '/app/1/reports?tab=pipeline' },
    ]);
    expect(propsOf(page, ReportTabs)).toStrictEqual([expect.objectContaining({ ownerId: 2 })]);
  });
});

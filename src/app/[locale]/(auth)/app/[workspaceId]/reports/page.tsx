import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListHeader } from '@/components/crm/list/ListHeader';
import { OwnerFilter } from '@/components/crm/list/OwnerFilter';
import { PeriodPicker } from '@/components/crm/PeriodPicker';
import { ActivityReport } from '@/components/crm/reports/ActivityReport';
import { FollowUpReport } from '@/components/crm/reports/FollowUpReport';
import { FunnelReport } from '@/components/crm/reports/FunnelReport';
import { PipelineReport } from '@/components/crm/reports/PipelineReport';
import { ReportTabs } from '@/components/crm/reports/ReportTabs';
import { WonLostReport } from '@/components/crm/reports/WonLostReport';
import {
  getActivityReport,
  getFollowUpReport,
  getFunnelReport,
  getMembers,
  getPipelineReport,
  getWonLostReport,
} from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import type { PeriodQuery } from '@/libs/crm/PeriodQuery';
import { parsePeriod, periodHref } from '@/libs/crm/PeriodQuery';
import type { ReportTab } from '@/libs/crm/Reports';
import { hasPeriod, parseOwner, parseTab, reportParams } from '@/libs/crm/Reports';
import { todayIn } from '@/libs/crm/ZonedTime';

type ReportsPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: ReportsPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'CrmReports' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

/**
 * The reports: the pipeline, the deals won and lost by month, the funnel, the team's activity and
 * the follow-ups, one tab each (`?tab=`, the pipeline without one). Only the shown report is
 * read. Every figure is the API's, as it answered, in the period the response names; the URL's
 * `?from&to` is read leniently, so a hand-edited one gives the default period, never an error.
 * The Owner chip (`?ownerId`) narrows every report to one member's records; an owner the API
 * refuses (a member who left, an id from another workspace) gives the whole workspace's report
 * under a notice that says so.
 * @param props Page props.
 * @returns The reports page.
 */
export default async function ReportsPage(props: ReportsPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CrmReports' });
  const searchParams = await props.searchParams;
  const tab = parseTab(searchParams);

  // The workspace (a cached call); a lost one is "not found" even on a client navigation. The
  // members are the Owner chip's.
  const [{ workspace }, { user }, members] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getMembers(workspaceId),
  ]);
  if (members.unauthorized) {
    return endRejectedSession(locale);
  }
  if (!workspace || !user || !members.members) {
    throw new Error('Could not load the workspace');
  }
  const { members: list } = members;
  const today = todayIn(workspace.timezone);
  const query: PeriodQuery = parsePeriod(searchParams, today);
  const ownerId = parseOwner(searchParams);
  const path = `/app/${workspace.id}/reports`;
  // A member by their id, whom a report names when it has nothing of theirs.
  const ownerOf = (id?: number) => list.find((member) => member.userId === id);

  // The shown report, of one member's records or of the workspace's: its page body and the period
  // it used (a report of a period), with the flags of its answer. Only the shown one is read.
  const loaders = {
    pipeline: async (owner?: number) => {
      const { report, ...flags } = await getPipelineReport(workspaceId, { ownerId: owner });
      return {
        ...flags,
        period: undefined,
        body: report && <PipelineReport report={report} owner={ownerOf(owner)} />,
      };
    },
    'won-lost': async (owner?: number) => {
      const { report, ...flags } = await getWonLostReport(workspaceId, {
        ...query,
        ownerId: owner,
      });
      return {
        ...flags,
        period: report?.period,
        body: report && <WonLostReport report={report} owner={ownerOf(owner)} />,
      };
    },
    funnel: async (owner?: number) => {
      const { report, ...flags } = await getFunnelReport(workspaceId, {
        ...query,
        ownerId: owner,
      });
      return {
        ...flags,
        period: report?.period,
        body: report && <FunnelReport report={report} owner={ownerOf(owner)} />,
      };
    },
    activities: async (owner?: number) => {
      const { report, ...flags } = await getActivityReport(workspaceId, {
        ...query,
        ownerId: owner,
      });
      return {
        ...flags,
        period: report?.period,
        body: report && <ActivityReport report={report} owner={ownerOf(owner)} />,
      };
    },
    'follow-ups': async (owner?: number) => {
      const { report, ...flags } = await getFollowUpReport(workspaceId, { ownerId: owner });
      return {
        ...flags,
        period: undefined,
        body: report && (
          <FollowUpReport
            report={report}
            workspace={workspace}
            today={today}
            owner={ownerOf(owner)}
          />
        ),
      };
    },
  } satisfies Record<ReportTab, (owner?: number) => Promise<unknown>>;
  let shown = await loaders[tab](ownerId);
  // The API refused the owner (400 on `ownerId`: a member who left, an id from elsewhere): the
  // whole workspace's report, under a notice.
  const ownerRefused = shown.invalid && ownerId !== undefined;
  if (ownerRefused) {
    shown = await loaders[tab]();
  }
  const { body, period, ...flags } = shown;
  if (flags.unauthorized) {
    return endRejectedSession(locale);
  }
  if (flags.forbidden) {
    return <ForbiddenNotice page />;
  }
  if (!body && !flags.invalid) {
    throw new Error('Could not load the report');
  }
  const params = reportParams(tab, ownerId);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <ListHeader
        title={t('title')}
        tabs={<ReportTabs current={tab} path={path} period={query} ownerId={ownerId} />}
      />
      {/* The toolbar: the owner's chip, first so it keeps its place from tab to tab, the period's
          for a report of a period, and what the report counts. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <OwnerFilter
          id="report-owner"
          chip
          unassigned={false}
          me={user}
          members={list}
          path={path}
          query={{ params: { ...params, ...query } }}
        />
        {hasPeriod(tab) && period && (
          <PeriodPicker
            period={period}
            path={path}
            params={params}
            today={today}
            timeZone={workspace.timezone}
          />
        )}
        <p className="max-w-[65ch] text-[0.8125rem] text-muted-foreground">{t(`intro_${tab}`)}</p>
      </div>
      {ownerRefused && (
        <InvalidFilterNotice
          resetHref={periodHref(path, { tab }, query)}
          messages={{
            title: t('owner_invalid_title'),
            text: t('owner_invalid_text'),
            reset: t('owner_invalid_reset'),
          }}
        />
      )}
      {body ?? <InvalidFilterNotice resetHref={`${path}?tab=${tab}`} />}
    </div>
  );
}

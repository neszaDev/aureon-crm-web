import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListHeader } from '@/components/crm/list/ListHeader';
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
  getPipelineReport,
  getWonLostReport,
} from '@/libs/api/CrmQueries';
import { endRejectedSession } from '@/libs/api/Session';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import type { PeriodQuery } from '@/libs/crm/PeriodQuery';
import { parsePeriod } from '@/libs/crm/PeriodQuery';
import type { ReportTab } from '@/libs/crm/Reports';
import { hasPeriod, parseTab } from '@/libs/crm/Reports';
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
 * @param props Page props.
 * @returns The reports page.
 */
export default async function ReportsPage(props: ReportsPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CrmReports' });
  const searchParams = await props.searchParams;
  const tab = parseTab(searchParams);

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const { workspace } = await getOpenWorkspace(locale, workspaceId);
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  const today = todayIn(workspace.timezone);
  const query: PeriodQuery = parsePeriod(searchParams, today);
  const path = `/app/${workspace.id}/reports`;

  // The shown report: its page body and the period it used (a report of a period), with the flags
  // of its answer. Only the shown one is read.
  const loaders = {
    pipeline: async () => {
      const { report, ...flags } = await getPipelineReport(workspaceId);
      return { ...flags, period: undefined, body: report && <PipelineReport report={report} /> };
    },
    'won-lost': async () => {
      const { report, ...flags } = await getWonLostReport(workspaceId, query);
      return {
        ...flags,
        period: report?.period,
        body: report && <WonLostReport report={report} />,
      };
    },
    funnel: async () => {
      const { report, ...flags } = await getFunnelReport(workspaceId, query);
      return { ...flags, period: report?.period, body: report && <FunnelReport report={report} /> };
    },
    activities: async () => {
      const { report, ...flags } = await getActivityReport(workspaceId, query);
      return {
        ...flags,
        period: report?.period,
        body: report && <ActivityReport report={report} />,
      };
    },
    'follow-ups': async () => {
      const { report, ...flags } = await getFollowUpReport(workspaceId);
      return {
        ...flags,
        period: undefined,
        body: report && <FollowUpReport report={report} workspace={workspace} today={today} />,
      };
    },
  } satisfies Record<ReportTab, () => Promise<unknown>>;
  const { body, period, ...flags } = await loaders[tab]();
  if (flags.unauthorized) {
    return endRejectedSession(locale);
  }
  if (flags.forbidden) {
    return <ForbiddenNotice page />;
  }
  if (!body && !flags.invalid) {
    throw new Error('Could not load the report');
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <ListHeader
        title={t('title')}
        tabs={<ReportTabs current={tab} path={path} period={query} />}
      />
      {/* The toolbar: the period's chip, for a report of a period, and what the report counts. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {hasPeriod(tab) && period && (
          <PeriodPicker
            period={period}
            path={path}
            params={{ tab }}
            today={today}
            timeZone={workspace.timezone}
          />
        )}
        <p className="max-w-[65ch] text-[0.8125rem] text-muted-foreground">{t(`intro_${tab}`)}</p>
      </div>
      {body ?? <InvalidFilterNotice resetHref={`${path}?tab=${tab}`} />}
    </div>
  );
}

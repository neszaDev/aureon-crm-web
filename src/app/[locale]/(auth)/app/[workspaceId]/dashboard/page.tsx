import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GetStarted } from '@/components/crm/dashboard/GetStarted';
import { KpiStrip } from '@/components/crm/dashboard/KpiStrip';
import { PipelineSummary } from '@/components/crm/dashboard/PipelineSummary';
import { RecentActivity } from '@/components/crm/dashboard/RecentActivity';
import { RecentChanges } from '@/components/crm/dashboard/RecentChanges';
import { StageDistribution } from '@/components/crm/dashboard/StageDistribution';
import { WonLostSummary } from '@/components/crm/dashboard/WonLostSummary';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListHeader } from '@/components/crm/list/ListHeader';
import { PeriodPicker } from '@/components/crm/PeriodPicker';
import { getDashboard, getMembers } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { parsePeriod } from '@/libs/crm/PeriodQuery';
import { todayIn } from '@/libs/crm/ZonedTime';

type DashboardPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: DashboardPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'CrmDashboard' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

/**
 * The workspace's pulse (Insights › Dashboard): its counts as one line of figures, the open deals
 * by stage, the deals won and lost in the period (its chip beside the title), the open pipeline,
 * and the workspace's latest activity and changes to records. Every figure is the API's, as it answered, in the period the
 * response names; the URL's `?from&to` is read leniently, so a hand-edited one gives the default
 * period, never an error. An empty workspace gets "Get started" instead. What is the caller's own
 * is on Home.
 * @param props Page props.
 * @returns The dashboard.
 */
export default async function DashboardPage(props: DashboardPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CrmDashboard' });

  // The user and the workspace (cached calls); a lost workspace is "not found" even on a client
  // navigation, which renders the page without its layout.
  const [{ user }, { workspace }] = await Promise.all([
    getCurrentUser(),
    getOpenWorkspace(locale, workspaceId),
  ]);
  if (!user || !workspace) {
    throw new Error('Could not load the workspace');
  }
  const today = todayIn(workspace.timezone);
  const period = parsePeriod(await props.searchParams, today);
  const [dashboard, members] = await Promise.all([
    getDashboard(workspaceId, period),
    getMembers(workspaceId),
  ]);
  if (dashboard.unauthorized || members.unauthorized) {
    return endRejectedSession(locale);
  }
  if (dashboard.forbidden) {
    return <ForbiddenNotice page />;
  }
  const path = `/app/${workspace.id}/dashboard`;
  if (dashboard.invalid) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <ListHeader title={t('title')} />
        <InvalidFilterNotice resetHref={path} />
      </div>
    );
  }
  const data = dashboard.dashboard;
  if (!data || !members.members) {
    throw new Error('Could not load the dashboard');
  }
  // A workspace with nothing in it, not even a deal won or lost in the period or a change, has
  // nothing to show: it starts with the way to its first records.
  const empty =
    Object.values(data.counts).every((count) => count === 0) &&
    data.won.count === 0 &&
    data.lost.count === 0 &&
    data.recentChanges.length === 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <ListHeader
        title={t('title')}
        action={
          !empty && (
            <PeriodPicker
              period={data.period}
              path={path}
              params={{}}
              today={today}
              timeZone={workspace.timezone}
            />
          )
        }
      />
      {empty ? (
        <GetStarted workspace={workspace} members={members.members} me={user.id} />
      ) : (
        <>
          <KpiStrip counts={data.counts} workspaceId={workspace.id} />
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <StageDistribution stages={data.byStage} />
            <div className="flex min-w-0 flex-col gap-5">
              <WonLostSummary won={data.won} lost={data.lost} />
              <PipelineSummary totals={data.openPipeline} />
            </div>
          </div>
          <div className="grid items-start gap-5 lg:grid-cols-2">
            <RecentActivity
              activities={data.recentActivities}
              workspaceId={workspace.id}
              timeZone={workspace.timezone}
            />
            <RecentChanges events={data.recentChanges} workspace={workspace} />
          </div>
        </>
      )}
    </div>
  );
}

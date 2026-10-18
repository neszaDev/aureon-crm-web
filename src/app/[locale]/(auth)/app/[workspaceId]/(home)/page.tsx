import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { FollowUps } from '@/components/crm/dashboard/FollowUps';
import { GetStarted } from '@/components/crm/dashboard/GetStarted';
import { KpiStrip } from '@/components/crm/dashboard/KpiStrip';
import { MyDeals } from '@/components/crm/dashboard/MyDeals';
import { PipelineSummary } from '@/components/crm/dashboard/PipelineSummary';
import { QuickActions } from '@/components/crm/dashboard/QuickActions';
import { RecentActivity } from '@/components/crm/dashboard/RecentActivity';
import { RecentChanges } from '@/components/crm/dashboard/RecentChanges';
import { StageDistribution } from '@/components/crm/dashboard/StageDistribution';
import { WonLostSummary } from '@/components/crm/dashboard/WonLostSummary';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { PeriodPicker } from '@/components/crm/PeriodPicker';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import {
  DEAL_LIST,
  getDashboard,
  getDeals,
  getMembers,
  getReminders,
  getStages,
} from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { parseListQuery } from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { parsePeriod } from '@/libs/crm/PeriodQuery';
import { slimReminders } from '@/libs/crm/Reminders';
import { todayIn } from '@/libs/crm/ZonedTime';

type DashboardPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// How many of the caller's open deals the dashboard lists.
const MY_DEALS = 5;

export async function generateMetadata(props: DashboardPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'CrmDashboard' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

/**
 * The workspace's home: its counts, the caller's deals and follow-ups, the open pipeline, the
 * period's won and lost deals, the stages, and the latest activity and changes. Every figure is
 * the API's, as it answered, in the period the response names; the URL's `?from&to` is read
 * leniently, so a hand-edited one gives the default period, never an error. An empty workspace
 * gets "Get started" instead.
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
  const [dashboard, deals, stages, reminders, members] = await Promise.all([
    getDashboard(workspaceId, period),
    getDeals(workspaceId, {
      ...parseListQuery(DEAL_LIST, { status: 'OPEN', ownerId: String(user.id) }),
      size: MY_DEALS,
    }),
    getStages(workspaceId),
    getReminders(workspaceId),
    getMembers(workspaceId),
  ]);
  if ([dashboard, deals, stages, reminders, members].some((result) => result.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (dashboard.forbidden) {
    return <ForbiddenNotice page />;
  }
  const path = `/app/${workspace.id}`;
  const header = (action?: React.ReactNode) => (
    <SettingsHeader
      title={t('title')}
      description={t('description', { name: workspace.name })}
      action={action}
    />
  );
  if (dashboard.invalid) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {header()}
        <InvalidFilterNotice resetHref={path} />
      </div>
    );
  }
  const data = dashboard.dashboard;
  if (!data || !deals.deals || !stages.stages || !members.members) {
    throw new Error('Could not load the dashboard');
  }
  // A workspace with nothing in it, not even a deal won or lost in the period or a change, has
  // nothing to show: it starts with the way to its first records.
  const empty =
    Object.values(data.counts).every((count) => count === 0) &&
    data.won.count === 0 &&
    data.lost.count === 0 &&
    data.recentChanges.length === 0;
  if (empty) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {header()}
        <GetStarted workspace={workspace} members={members.members} me={user.id} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      {header(<QuickActions workspace={workspace} members={members.members} me={user.id} />)}

      <KpiStrip counts={data.counts} workspaceId={workspace.id} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <MyDeals
          deals={deals.deals.content}
          total={deals.deals.totalElements}
          stages={stages.stages}
          workspaceId={workspace.id}
          me={user.id}
          now={new Date()}
        />
        <FollowUps
          workspace={workspace}
          me={user.id}
          overdue={data.myOverdueTasks}
          upcoming={data.myUpcomingTasks}
          leads={reminders.reminders && slimReminders(reminders.reminders).followUpLeads}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <PipelineSummary totals={data.openPipeline} />
        <WonLostSummary
          won={data.won}
          lost={data.lost}
          action={
            <PeriodPicker
              period={data.period}
              path={path}
              params={{}}
              today={today}
              timeZone={workspace.timezone}
            />
          }
        />
        <StageDistribution stages={data.byStage} className="lg:col-span-2 xl:col-span-1" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <RecentActivity
          activities={data.recentActivities}
          workspaceId={workspace.id}
          timeZone={workspace.timezone}
        />
        <RecentChanges events={data.recentChanges} workspace={workspace} />
      </div>
    </div>
  );
}

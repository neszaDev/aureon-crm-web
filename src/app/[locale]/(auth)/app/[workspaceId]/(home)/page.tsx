import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { GetStarted } from '@/components/crm/dashboard/GetStarted';
import { MyDeals } from '@/components/crm/dashboard/MyDeals';
import { MyWork } from '@/components/crm/dashboard/MyWork';
import { RecentActivity } from '@/components/crm/dashboard/RecentActivity';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
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
import { parsePeriod, periodHref } from '@/libs/crm/PeriodQuery';
import { slimReminders } from '@/libs/crm/Reminders';
import { dueBounds } from '@/libs/crm/TaskViews';
import { partOfDay, todayIn } from '@/libs/crm/ZonedTime';
import { redirect } from '@/libs/I18nNavigation';

type HomePageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// How many of the caller's open deals the home lists.
const MY_DEALS = 5;

export async function generateMetadata(props: HomePageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'CrmHome' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

/**
 * The workspace's home, the rail's Home: a greeting by the workspace's clock, then what is the
 * caller's (their tasks by when they are due and their leads to follow up, their open deals) and
 * the latest activity in the workspace. The workspace's own figures are on the Dashboard, where a
 * link to the home with a period (`?from&to`, the dashboard's before it moved) is sent. An empty
 * workspace gets "Get started" instead.
 * @param props Page props.
 * @returns The home.
 */
export default async function HomePage(props: HomePageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CrmHome' });

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
  // The dashboard was here: an old link to it with a period goes there, with the period.
  const searchParams = await props.searchParams;
  if (searchParams.from !== undefined || searchParams.to !== undefined) {
    return redirect({
      href: periodHref(`/app/${workspace.id}/dashboard`, {}, parsePeriod(searchParams, today)),
      locale,
    });
  }
  // The dashboard's read carries the caller's tasks and the latest activity; its period is unused.
  const [dashboard, deals, stages, reminders, members] = await Promise.all([
    getDashboard(workspaceId, {}),
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
  const data = dashboard.dashboard;
  if (!data || !deals.deals || !stages.stages || !members.members) {
    throw new Error('Could not load the home');
  }
  // A workspace with nothing in it, not even a deal won or lost lately or a change, has nothing
  // to show: it starts with the way to its first records.
  const empty =
    Object.values(data.counts).every((count) => count === 0) &&
    data.won.count === 0 &&
    data.lost.count === 0 &&
    data.recentChanges.length === 0;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <header className="flex flex-col gap-0.5">
        <h1 className="text-[1.25rem] leading-7 font-semibold tracking-[-0.01em] break-words">
          {t('greeting', {
            part: partOfDay(workspace.timezone),
            name: user.displayName ?? user.email,
          })}
        </h1>
        <p className="text-sm break-words text-muted-foreground">
          {t('description', { name: workspace.name })}
        </p>
      </header>

      {empty ? (
        <GetStarted workspace={workspace} members={members.members} me={user.id} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-5">
            <MyWork
              workspace={workspace}
              me={user.id}
              overdue={data.myOverdueTasks}
              upcoming={data.myUpcomingTasks}
              leads={reminders.reminders && slimReminders(reminders.reminders, today).followUpLeads}
              bounds={dueBounds(workspace.timezone)}
              today={today}
            />
            <MyDeals
              deals={deals.deals.content}
              total={deals.deals.totalElements}
              stages={stages.stages}
              workspaceId={workspace.id}
              me={user.id}
              now={new Date()}
              timeZone={workspace.timezone}
            />
          </div>
          <RecentActivity
            activities={data.recentActivities}
            workspaceId={workspace.id}
            timeZone={workspace.timezone}
          />
        </div>
      )}
    </div>
  );
}

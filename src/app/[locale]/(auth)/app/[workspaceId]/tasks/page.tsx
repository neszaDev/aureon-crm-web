import { cn } from 'cn';
import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { FilterRow } from '@/components/crm/list/FilterRow';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListEmpty } from '@/components/crm/list/ListEmpty';
import { ListPager } from '@/components/crm/list/ListPager';
import { OwnerFilter } from '@/components/crm/list/OwnerFilter';
import { SearchBox } from '@/components/crm/list/SearchBox';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { TaskDialog } from '@/components/crm/task/TaskDialog';
import { TaskTable } from '@/components/crm/task/TaskTable';
import { Button } from '@/components/ui/button';
import type { TaskQuery, TaskView } from '@/libs/api/CrmQueries';
import { getMembers, getTasks, TASK_LIST, TASK_VIEWS, taskViewQuery } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref, parseListQuery } from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign } from '@/libs/crm/RecordAccess';
import { Link, redirect } from '@/libs/I18nNavigation';

type TasksPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The task list's query for a view: "Mine" is the caller's open tasks, without the search and
 * the assignee filter, which the other views take.
 * @param view The view.
 * @param query The page's list query.
 * @returns The backend's query.
 */
const viewQuery = (view: TaskView, query: ListQuery<typeof TASK_LIST>): TaskQuery => ({
  sort: 'DUE_AT',
  ...taskViewQuery(view, Date.now()),
  ...(view !== 'mine' && {
    q: query.q,
    assigneeId: query.filters.assigneeId,
    unassigned: query.unassigned,
  }),
  page: query.page,
  size: query.size,
});

/**
 * Tells whether a view's list is narrowed by the search or the assignee (which "Mine" doesn't
 * take): empty, it says "Nothing matches" rather than that the view itself is empty.
 * @param view The view.
 * @param query The page's list query.
 * @returns Whether it is narrowed.
 */
const isNarrowed = (view: TaskView, query: ListQuery<typeof TASK_LIST>) =>
  view !== 'mine' &&
  [query.q, query.unassigned, query.filters.assigneeId].some((value) => value !== undefined);

export async function generateMetadata(props: TasksPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'TasksPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function TasksPage(props: TasksPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TasksPage' });
  const query = parseListQuery(TASK_LIST, await props.searchParams);
  const view = query.filters.view ?? 'mine';

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, list, members] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getTasks(workspaceId, viewQuery(view, query)),
    getMembers(workspaceId),
  ]);
  if ([list, members].some((result) => result.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (list.forbidden) {
    return <ForbiddenNotice page />;
  }
  if (!workspace || !user || (!list.tasks && !list.invalid) || !members.members) {
    throw new Error('Could not load the tasks');
  }
  const path = `/app/${workspace.id}/tasks`;
  const page = list.tasks;
  // A page past the end (a hand-edited link, or tasks done meanwhile): the last one instead.
  if (page && page.content.length === 0 && page.totalPages > 0) {
    return redirect({
      href: listHref(path, query, {
        page: page.totalPages > 1 ? String(page.totalPages - 1) : undefined,
      }),
      locale,
    });
  }
  const narrowed = isNarrowed(view, query);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <SettingsHeader
        title={t('title')}
        description={t('description')}
        action={
          <TaskDialog
            trigger={
              <Button>
                <PlusIcon data-icon="inline-start" />
                {t('new')}
              </Button>
            }
            workspaceId={workspace.id}
            members={members.members}
            me={user.id}
            canAssign={canAssign(workspace)}
            timeZone={workspace.timezone}
          />
        }
      />

      <nav aria-label={t('views_label')} className="flex flex-wrap gap-1 border-b border-rule">
        {TASK_VIEWS.map((item) => (
          <Link
            key={item}
            href={listHref(path, query, { view: item === 'mine' ? undefined : item })}
            aria-current={item === view ? 'page' : undefined}
            scroll={false}
            className={cn(
              '-mb-px flex min-h-9 items-center border-b-2 px-3 text-sm font-medium no-underline transition-colors duration-150',
              item === view
                ? 'border-seal-ink font-semibold text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`view_${item}`)}
          </Link>
        ))}
      </nav>

      {view !== 'mine' && (
        <FilterRow label={t('toolbar_label')}>
          <SearchBox
            id="tasks-search"
            label={t('search_label')}
            placeholder={t('search_placeholder')}
            param="q"
            path={path}
            query={query}
          />
          <OwnerFilter
            id="tasks-assignee"
            param="assigneeId"
            me={user}
            members={members.members}
            path={path}
            query={query}
          />
        </FilterRow>
      )}

      {page ? (
        <section
          aria-labelledby="tasks-heading"
          className="overflow-hidden rounded-lg border border-rule bg-card"
        >
          <h2
            id="tasks-heading"
            tabIndex={-1}
            className="rounded-sm px-4 pt-4 pb-3 font-semibold sm:px-5"
          >
            {t('list_heading', { count: page.totalElements })}
          </h2>
          {page.content.length > 0 && (
            <>
              <div className="border-t border-rule">
                <TaskTable
                  tasks={page.content}
                  workspaceId={workspace.id}
                  permissions={workspace.permissions}
                  me={user.id}
                  timeZone={workspace.timezone}
                  headingId="tasks-heading"
                />
              </div>
              <ListPager path={path} query={query} total={page.totalElements} />
            </>
          )}
          {page.content.length === 0 && narrowed && (
            <ListEmpty variant="filtered" clearHref={listHref(path, { params: {} }, { view })} />
          )}
          {page.content.length === 0 && !narrowed && (
            <ListEmpty
              variant="none"
              title={t(`empty_title_${view}`)}
              text={t(`empty_text_${view}`)}
            />
          )}
        </section>
      ) : (
        <InvalidFilterNotice resetHref={path} />
      )}
    </div>
  );
}

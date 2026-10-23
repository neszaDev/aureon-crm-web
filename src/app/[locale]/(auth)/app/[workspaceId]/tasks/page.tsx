import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { addTask } from '@/actions/crm/TaskActions';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { InlineAddRow } from '@/components/crm/list/InlineAddRow';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListHeader } from '@/components/crm/list/ListHeader';
import { RecordList } from '@/components/crm/list/RecordList';
import { StatusPill } from '@/components/crm/StatusPill';
import { TaskDialog } from '@/components/crm/task/TaskDialog';
import { TaskFilters } from '@/components/crm/task/TaskFilters';
import { TaskTable } from '@/components/crm/task/TaskTable';
import { Button } from '@/components/ui/button';
import type { TaskQuery } from '@/libs/api/CrmQueries';
import { getMembers, getTasks, getUndatedTasks, TASK_LIST } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { groupQuery, listHref, parseListQuery, pastEndHref } from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign } from '@/libs/crm/RecordAccess';
import type { DueBounds, TaskView } from '@/libs/crm/TaskViews';
import { dueBounds, SECTION_TONES, sectionsOf, viewQuery } from '@/libs/crm/TaskViews';
import { redirect } from '@/libs/I18nNavigation';

type TasksPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const MINUTE = 60 * 1000;

/**
 * Reads the Tasks page's list: grouped, each section of the view on its own (its first rows and
 * its total), all at once; else the view's page.
 * @param workspaceId The `[workspaceId]` route segment.
 * @param query The page's list query.
 * @param bounds Where the due sections part.
 * @returns The sections read (none when ungrouped) and a list per read.
 */
const readTasks = async (
  workspaceId: string,
  query: ListQuery<typeof TASK_LIST>,
  bounds: DueBounds,
) => {
  const shared: TaskQuery = {
    q: query.q,
    assigneeId: query.filters.assigneeId,
    unassigned: query.unassigned,
    sort: query.sort,
    direction: query.direction,
  };
  const read = async (view: TaskView | undefined, paging: Pick<TaskQuery, 'page' | 'size'>) =>
    view === 'undated'
      ? await getUndatedTasks(workspaceId, { ...shared, ...paging }, bounds.now)
      : await getTasks(workspaceId, {
          ...shared,
          ...viewQuery(view, bounds, query.params.sort !== undefined),
          ...paging,
        });
  if (!query.group) {
    return { sections: [], lists: [await read(query.filters.view, query)] };
  }
  const sections = sectionsOf(query.filters.view);
  const { page, size } = groupQuery(query, {});

  return {
    sections,
    lists: await Promise.all(sections.map(async (section) => await read(section, { page, size }))),
  };
};

export async function generateMetadata(props: TasksPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'TasksPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function TasksPage(props: TasksPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TasksPage' });
  const searchParams = await props.searchParams;
  const query = parseListQuery(TASK_LIST, searchParams);
  const { view } = query.filters;

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, members] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getMembers(workspaceId),
  ]);
  if (members.unauthorized) {
    return endRejectedSession(locale);
  }
  if (!workspace || !user || !members.members) {
    throw new Error('Could not load the tasks');
  }
  const path = `/app/${workspace.id}/tasks`;
  // The old tabs' links: "My tasks" is the Me toggle now, "All" the list without a view.
  if (view === 'mine' || view === 'all') {
    return redirect({
      href: listHref(path, query, {
        view: undefined,
        ...(view === 'mine' && { assigneeId: String(user.id) }),
      }),
      locale,
    });
  }
  const bounds = dueBounds(workspace.timezone);
  const { sections, lists } = await readTasks(workspaceId, query, bounds);
  if (lists.some((list) => list.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (lists.some((list) => list.forbidden)) {
    return <ForbiddenNotice page />;
  }
  if (lists.some((list) => !list.tasks && !list.invalid)) {
    throw new Error('Could not load the tasks');
  }
  const pages = lists.some((list) => list.invalid)
    ? undefined
    : lists.flatMap((list) => list.tasks ?? []);
  const last = pastEndHref(path, query, query.group ? undefined : pages?.[0]);
  if (last) {
    return redirect({ href: last, locale });
  }
  // A task added for today is due at its last minute.
  const endOfToday = new Date(Date.parse(bounds.tomorrow) - MINUTE).toISOString();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <ListHeader
        title={t('title')}
        count={pages?.reduce((sum, item) => sum + item.totalElements, 0)}
        action={
          <TaskDialog
            // A fresh dialog when "+ New" asks for one on this page.
            key={String(searchParams.new === '1')}
            defaultOpen={searchParams.new === '1'}
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

      <TaskFilters path={path} query={query} me={user} members={members.members} />

      {pages ? (
        <RecordList
          id="tasks-heading"
          heading={(count) => t('list_heading', { count })}
          path={path}
          query={query}
          pages={pages}
          groups={
            query.group
              ? sections.map((section) => {
                  const closed = section === 'completed' || section === 'cancelled';
                  return {
                    key: section,
                    title: (
                      <StatusPill
                        tone={SECTION_TONES[section]}
                        label={t(`section_${section}`)}
                        field={closed ? undefined : t('due_label')}
                      />
                    ),
                    params: { group: 'none', view: section },
                    // Today shows even without tasks, for the row that adds one.
                    keep: section === 'today',
                    closed,
                  };
                })
              : undefined
          }
          members={members.members}
          me={user.id}
          mayAssign={canAssign(workspace)}
          empty={{
            title: t('empty_title'),
            text: t('empty_text'),
            // Tasks aren't archived.
            archivedText: '',
            action: null,
          }}
          table={(rows) => (
            <TaskTable
              tasks={rows}
              workspaceId={workspace.id}
              permissions={workspace.permissions}
              me={user.id}
              timeZone={workspace.timezone}
              headingId="tasks-heading"
              bounds={bounds}
              fixed
            />
          )}
          // A task by its title, due today in the Today section and without a due time in its own
          // (else none, where the list shows those), for the filter's assignee or the caller.
          addRow={(owner, key) => {
            const due = query.group ? key : (view ?? 'undated');
            if (due !== 'today' && due !== 'undated') {
              return null;
            }
            let label = owner ? t('add_for', { name: owner.name }) : t('new');
            if (query.group) {
              label = t(`add_${due}`);
            }
            return (
              <InlineAddRow
                label={label}
                placeholder={t('new')}
                action={addTask.bind(null, workspace.id, {
                  assigneeId: owner?.userId ?? null,
                  dueAt: due === 'today' ? endOfToday : null,
                })}
              />
            );
          }}
        />
      ) : (
        <InvalidFilterNotice resetHref={path} />
      )}
    </div>
  );
}

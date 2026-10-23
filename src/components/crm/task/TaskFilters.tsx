import { useTranslations } from 'next-intl';
import { OptionsChip } from '@/components/crm/list/FilterChip';
import { GroupMenu } from '@/components/crm/list/GroupMenu';
import { ListToolbar } from '@/components/crm/list/ListToolbar';
import { MeToggle } from '@/components/crm/list/MeToggle';
import { OwnerFilter } from '@/components/crm/list/OwnerFilter';
import { SearchBox } from '@/components/crm/list/SearchBox';
import { SortMenu } from '@/components/crm/list/SortMenu';
import type { TASK_LIST } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { filterCount } from '@/libs/crm/ListQuery';
import { TASK_SECTIONS } from '@/libs/crm/TaskViews';

/**
 * The task list's toolbar: the title search; the due chip (one section: overdue, today, the next
 * 7 days, later, no due date, completed or cancelled) and the assignee chip; the grouping (by due
 * time by default, or none), the sort and "Me" (assigned to the caller). What were the page's
 * tabs: My tasks is "Me", Overdue, Next 7 days and Completed are the due chip's.
 * @param props Component props.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @param props.me The caller.
 * @param props.members The workspace's members.
 * @returns The toolbar.
 */
export const TaskFilters = (props: {
  path: string;
  query: ListQuery<typeof TASK_LIST>;
  me: components['schemas']['UserResponse'];
  members: components['schemas']['MemberResponse'][];
}) => {
  const t = useTranslations('TasksPage');
  const tList = useTranslations('ListToolbar');

  return (
    <ListToolbar
      label={t('toolbar_label')}
      filters={filterCount(props.query)}
      search={
        <SearchBox
          id="tasks-search"
          label={t('search_label')}
          placeholder={t('search_placeholder')}
          param="q"
          path={props.path}
          query={props.query}
          hideLabel
          className="min-w-40 basis-60 md:max-w-56 md:flex-none"
        />
      }
    >
      <OptionsChip
        label={t('due_label')}
        anyLabel={t('due_any')}
        // The one view the options don't hold: the follow-up report's today and next 7 days.
        missingLabel={t('section_upcoming')}
        param="view"
        options={TASK_SECTIONS.map((section) => ({
          value: section,
          label: t(`section_${section}`),
        }))}
        path={props.path}
        query={props.query}
      />
      <OwnerFilter
        id="tasks-assignee"
        chip
        param="assigneeId"
        me={props.me}
        members={props.members}
        path={props.path}
        query={props.query}
      />
      <GroupMenu
        options={[{ group: 'due', label: tList('group_due') }]}
        defaultGroup="due"
        path={props.path}
        query={props.query}
      />
      <SortMenu
        options={[
          { sort: 'DUE_AT', label: tList('sort_due') },
          { sort: 'PRIORITY', label: tList('sort_priority') },
        ]}
        path={props.path}
        query={props.query}
      />
      <MeToggle me={props.me} param="assigneeId" path={props.path} query={props.query} />
    </ListToolbar>
  );
};

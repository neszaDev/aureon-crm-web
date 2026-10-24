import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { StatusFilter } from '@/components/crm/lead/StatusFilter';
import { ArchivedToggle } from '@/components/crm/list/ArchivedToggle';
import { DateFilter } from '@/components/crm/list/DateFilter';
import { ExportButton } from '@/components/crm/list/ExportButton';
import { FilterChip, OptionsChip } from '@/components/crm/list/FilterChip';
import { GroupMenu } from '@/components/crm/list/GroupMenu';
import { ListToolbar } from '@/components/crm/list/ListToolbar';
import { MeToggle } from '@/components/crm/list/MeToggle';
import { MoreFilters } from '@/components/crm/list/MoreFilters';
import { OwnerFilter } from '@/components/crm/list/OwnerFilter';
import { SearchBox } from '@/components/crm/list/SearchBox';
import { SortMenu } from '@/components/crm/list/SortMenu';
import type { LEAD_LIST } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import { formatDate } from '@/libs/crm/Format';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { filterCount, listHref } from '@/libs/crm/ListQuery';
import type { Permission } from '@/libs/crm/Permissions';
import { LEAD_PRIORITIES } from '@/validations/crm/LeadValidation';

/**
 * The lead list's toolbar, one line from 1440 px: the text search; the status (any number), owner
 * and priority chips, and "More" (source, "follow-up on or before"); the grouping (status by default, owner, or none), the sort,
 * "Me" and the archived view; the export.
 * @param props Component props.
 * @param props.workspace The workspace, with the caller's permissions (the export needs `EXPORT`).
 * @param props.workspace.id Its id.
 * @param props.workspace.permissions The caller's permissions.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @param props.me The caller.
 * @param props.members The workspace's members.
 * @param props.sources Every lead source, archived ones included.
 * @param props.timeZone The workspace's time zone, for the calendar.
 * @returns The toolbar.
 */
export const LeadFilters = (props: {
  workspace: { id: number; permissions: Permission[] };
  path: string;
  query: ListQuery<typeof LEAD_LIST>;
  me: components['schemas']['UserResponse'];
  members: components['schemas']['MemberResponse'][];
  sources: components['schemas']['LeadSourceResponse'][];
  timeZone: string;
}) => {
  const t = useTranslations('LeadsPage');
  const tSource = useTranslations('SourceField');
  const tStatus = useTranslations('LeadStatus');
  const tList = useTranslations('ListToolbar');
  const format = useFormatter();
  const locale = useLocale();
  const { status, sourceId, followUpBefore } = props.query.filters;

  return (
    <ListToolbar
      label={t('toolbar_label')}
      filters={filterCount(props.query)}
      search={
        <SearchBox
          id="leads-search"
          label={t('search_label')}
          placeholder={t('search_placeholder')}
          param="q"
          path={props.path}
          query={props.query}
          hideLabel
          // The line breaks by its 160 px; it grows into the room the line leaves.
          className="min-w-40 basis-60 md:max-w-56 md:basis-40"
        />
      }
      end={
        <ExportButton
          workspaceId={props.workspace.id}
          permissions={props.workspace.permissions}
          list="leads"
          params={props.query.params}
        />
      }
    >
      <FilterChip
        label={t('status_label')}
        value={status && format.list(status.map((item) => tStatus(`status_${item}`)))}
        clearHref={listHref(props.path, props.query, { status: undefined })}
      >
        <StatusFilter path={props.path} query={props.query} />
      </FilterChip>
      <OwnerFilter
        id="leads-owner"
        chip
        me={props.me}
        members={props.members}
        path={props.path}
        query={props.query}
      />
      <OptionsChip
        label={t('priority_label')}
        anyLabel={t('priority_any')}
        // The URL holds only a valid priority, which the options list.
        missingLabel=""
        param="priority"
        options={LEAD_PRIORITIES.map((priority) => ({
          value: priority,
          label: tStatus(`priority_${priority}`),
        }))}
        path={props.path}
        query={props.query}
      />
      <MoreFilters count={[sourceId, followUpBefore].filter((value) => value !== undefined).length}>
        <OptionsChip
          label={t('source_label')}
          anyLabel={t('source_any')}
          missingLabel={t('source_unknown')}
          param="sourceId"
          options={props.sources.map((source) => ({
            value: String(source.id),
            label: source.archived ? tSource('archived', { name: source.name }) : source.name,
          }))}
          path={props.path}
          query={props.query}
        />
        <FilterChip
          label={t('follow_up_label')}
          value={followUpBefore && formatDate(followUpBefore, locale)}
          clearHref={listHref(props.path, props.query, { followUpBefore: undefined })}
        >
          <DateFilter
            id="leads-follow-up-before"
            label={t('follow_up_label')}
            param="followUpBefore"
            path={props.path}
            query={props.query}
            timeZone={props.timeZone}
          />
        </FilterChip>
      </MoreFilters>
      <GroupMenu
        options={[
          { group: 'status', label: tList('group_status') },
          { group: 'owner', label: tList('group_owner') },
        ]}
        defaultGroup="status"
        path={props.path}
        query={props.query}
      />
      <SortMenu
        options={[
          { sort: 'CREATED_AT', label: tList('sort_created') },
          { sort: 'UPDATED_AT', label: tList('sort_updated') },
          { sort: 'FOLLOW_UP_DATE', label: tList('sort_follow_up') },
          { sort: 'PRIORITY', label: tList('sort_priority') },
          { sort: 'NAME', label: tList('sort_name') },
        ]}
        path={props.path}
        query={props.query}
      />
      <MeToggle me={props.me} path={props.path} query={props.query} />
      <ArchivedToggle path={props.path} query={props.query} />
    </ListToolbar>
  );
};

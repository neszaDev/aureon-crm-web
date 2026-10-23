import { useTranslations } from 'next-intl';
import { StatusFilter } from '@/components/crm/lead/StatusFilter';
import { ArchivedToggle } from '@/components/crm/list/ArchivedToggle';
import { DateFilter } from '@/components/crm/list/DateFilter';
import { FilterRow } from '@/components/crm/list/FilterRow';
import type { FilterOption } from '@/components/crm/list/FilterSelect';
import { FilterSelect } from '@/components/crm/list/FilterSelect';
import { OwnerFilter } from '@/components/crm/list/OwnerFilter';
import { SearchBox } from '@/components/crm/list/SearchBox';
import type { LEAD_LIST } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { LEAD_PRIORITIES } from '@/validations/crm/LeadValidation';

/**
 * The lead list's search and filters: the text search, the statuses (any number), the owner
 * (Anyone, Me, Unassigned, each member), the source, the priority, "follow-up before" (inclusive)
 * and the archived view.
 * @param props Component props.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @param props.me The caller.
 * @param props.members The workspace's members.
 * @param props.sources Every lead source, archived ones included.
 * @param props.timeZone The workspace's time zone, for the calendar.
 * @returns The toolbar.
 */
export const LeadFilters = (props: {
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
  const sourceOptions: FilterOption[] = props.sources.map((source) => ({
    value: String(source.id),
    label: source.archived ? tSource('archived', { name: source.name }) : source.name,
  }));

  return (
    <FilterRow label={t('toolbar_label')}>
      <SearchBox
        id="leads-search"
        label={t('search_label')}
        placeholder={t('search_placeholder')}
        param="q"
        path={props.path}
        query={props.query}
        // A row of its own: the filters would cut its placeholder short.
        className="basis-full"
      />
      <StatusFilter path={props.path} query={props.query} />
      <OwnerFilter
        id="leads-owner"
        me={props.me}
        members={props.members}
        path={props.path}
        query={props.query}
      />
      <FilterSelect
        id="leads-source"
        label={t('source_label')}
        anyLabel={t('source_any')}
        missingLabel={t('source_unknown')}
        param="sourceId"
        options={sourceOptions}
        path={props.path}
        query={props.query}
      />
      <FilterSelect
        id="leads-priority"
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
      <DateFilter
        id="leads-follow-up-before"
        label={t('follow_up_label')}
        param="followUpBefore"
        path={props.path}
        query={props.query}
        timeZone={props.timeZone}
      />
      <ArchivedToggle path={props.path} query={props.query} />
    </FilterRow>
  );
};

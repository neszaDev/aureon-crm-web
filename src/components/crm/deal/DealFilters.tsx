import { useTranslations } from 'next-intl';
import { ArchivedToggle } from '@/components/crm/list/ArchivedToggle';
import { DateFilter } from '@/components/crm/list/DateFilter';
import type { FilterOption } from '@/components/crm/list/FilterSelect';
import { FilterSelect } from '@/components/crm/list/FilterSelect';
import { ListToolbar } from '@/components/crm/list/ListToolbar';
import { OwnerFilter } from '@/components/crm/list/OwnerFilter';
import { RecordFilter } from '@/components/crm/list/RecordFilter';
import { SearchBox } from '@/components/crm/list/SearchBox';
import { SortSelect } from '@/components/crm/list/SortSelect';
import type { DEAL_LIST } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { DEAL_STATUSES } from '@/validations/crm/DealValidation';

/**
 * The deals page's search and filters. The board takes the text search, the owner (Anyone, Me,
 * Unassigned, each member) and the company; the table adds the stage, the status, the contact,
 * the lead source, the expected close dates (from and until, inclusive), the sort and the
 * archived view.
 * @param props Component props.
 * @param props.workspaceId The workspace, whose companies and contacts the pickers search.
 * @param props.view The page's view.
 * @param props.path The page's path.
 * @param props.query The current list query.
 * @param props.me The caller.
 * @param props.members The workspace's members.
 * @param props.stages The pipeline's stages, for the stage filter.
 * @param props.sources Every lead source, archived ones included.
 * @param props.companyName The name of the company filtered by, when it was found.
 * @param props.contactName The name of the contact filtered by, when it was found.
 * @param props.timeZone The workspace's time zone, for the calendars.
 * @returns The toolbar.
 */
export const DealFilters = (props: {
  workspaceId: number;
  view: 'board' | 'list';
  path: string;
  query: ListQuery<typeof DEAL_LIST>;
  me: components['schemas']['UserResponse'];
  members: components['schemas']['MemberResponse'][];
  stages: components['schemas']['StageResponse'][];
  sources: components['schemas']['LeadSourceResponse'][];
  companyName?: string;
  contactName?: string;
  timeZone: string;
}) => {
  const t = useTranslations('DealsPage');
  const tStatus = useTranslations('DealStatus');
  const tSource = useTranslations('SourceField');
  const sourceOptions: FilterOption[] = props.sources.map((source) => ({
    value: String(source.id),
    label: source.archived ? tSource('archived', { name: source.name }) : source.name,
  }));

  return (
    <ListToolbar label={t('toolbar_label')}>
      <SearchBox
        id="deals-search"
        label={t('search_label')}
        placeholder={t('search_placeholder')}
        param="q"
        path={props.path}
        query={props.query}
        // A row of its own: the filters would cut its placeholder short.
        className="basis-full"
      />
      <OwnerFilter
        id="deals-owner"
        me={props.me}
        members={props.members}
        path={props.path}
        query={props.query}
      />
      <RecordFilter
        id="deals-company"
        label={t('company_label')}
        placeholder={t('company_any')}
        workspaceId={props.workspaceId}
        kind="company"
        param="companyId"
        value={
          props.query.filters.companyId === undefined
            ? null
            : {
                id: props.query.filters.companyId,
                label: props.companyName ?? t('company_unknown'),
              }
        }
        path={props.path}
        query={props.query}
      />
      {props.view === 'list' && (
        <>
          <RecordFilter
            id="deals-contact"
            label={t('contact_label')}
            placeholder={t('contact_any')}
            workspaceId={props.workspaceId}
            kind="contact"
            param="contactId"
            value={
              props.query.filters.contactId === undefined
                ? null
                : {
                    id: props.query.filters.contactId,
                    label: props.contactName ?? t('contact_unknown'),
                  }
            }
            path={props.path}
            query={props.query}
          />
          <FilterSelect
            id="deals-stage"
            label={t('stage_label')}
            anyLabel={t('stage_any')}
            missingLabel={t('stage_unknown')}
            param="stageId"
            options={props.stages.map((stage) => ({ value: String(stage.id), label: stage.name }))}
            path={props.path}
            query={props.query}
          />
          <FilterSelect
            id="deals-status"
            label={t('status_label')}
            anyLabel={t('status_any')}
            // The URL holds only a valid status, which the options list.
            missingLabel=""
            param="status"
            options={DEAL_STATUSES.map((status) => ({
              value: status,
              label: tStatus(`status_${status}`),
            }))}
            path={props.path}
            query={props.query}
          />
          <FilterSelect
            id="deals-source"
            label={t('source_label')}
            anyLabel={t('source_any')}
            missingLabel={t('source_unknown')}
            param="sourceId"
            options={sourceOptions}
            path={props.path}
            query={props.query}
          />
          <DateFilter
            id="deals-close-from"
            label={t('close_from_label')}
            param="closeFrom"
            path={props.path}
            query={props.query}
            timeZone={props.timeZone}
          />
          <DateFilter
            id="deals-close-to"
            label={t('close_to_label')}
            param="closeTo"
            path={props.path}
            query={props.query}
            timeZone={props.timeZone}
          />
          <SortSelect
            id="deals-sort"
            options={[
              { sort: 'UPDATED_AT', label: t('sort_UPDATED_AT') },
              { sort: 'CREATED_AT', label: t('sort_CREATED_AT') },
              { sort: 'NAME', label: t('sort_NAME') },
              { sort: 'AMOUNT', label: t('sort_AMOUNT') },
              { sort: 'EXPECTED_CLOSE_DATE', label: t('sort_EXPECTED_CLOSE_DATE') },
            ]}
            path={props.path}
            query={props.query}
          />
          <ArchivedToggle path={props.path} query={props.query} />
        </>
      )}
    </ListToolbar>
  );
};

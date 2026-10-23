import { useLocale, useTranslations } from 'next-intl';
import { ArchivedToggle } from '@/components/crm/list/ArchivedToggle';
import { DateFilter } from '@/components/crm/list/DateFilter';
import { ExportButton } from '@/components/crm/list/ExportButton';
import { FilterChip, OptionsChip } from '@/components/crm/list/FilterChip';
import { GroupMenu } from '@/components/crm/list/GroupMenu';
import { ListToolbar } from '@/components/crm/list/ListToolbar';
import { MeToggle } from '@/components/crm/list/MeToggle';
import { OwnerFilter } from '@/components/crm/list/OwnerFilter';
import { RecordFilter } from '@/components/crm/list/RecordFilter';
import { SearchBox } from '@/components/crm/list/SearchBox';
import { SortMenu } from '@/components/crm/list/SortMenu';
import type { DEAL_LIST } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import { formatDate } from '@/libs/crm/Format';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { filterCount, listHref } from '@/libs/crm/ListQuery';
import type { Permission } from '@/libs/crm/Permissions';
import { DEAL_STATUSES } from '@/validations/crm/DealValidation';

/**
 * The deals page's toolbar. The board takes the text search, the owner and company chips and
 * "Me"; the list adds the contact, stage, status, source and expected close (from, until, both
 * inclusive) chips, the grouping (stage by default, owner, or none), the sort and the archived
 * view. The export ends it in both.
 * @param props Component props.
 * @param props.workspace The workspace, with the caller's permissions (the export needs `EXPORT`).
 * @param props.workspace.id Its id; the pickers search its companies and contacts.
 * @param props.workspace.permissions The caller's permissions.
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
  workspace: { id: number; permissions: Permission[] };
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
  const tList = useTranslations('ListToolbar');
  const locale = useLocale();
  const { companyId, contactId, closeFrom, closeTo } = props.query.filters;
  const company =
    companyId === undefined
      ? null
      : { id: companyId, label: props.companyName ?? t('company_unknown') };
  const contact =
    contactId === undefined
      ? null
      : { id: contactId, label: props.contactName ?? t('contact_unknown') };
  const closeChip = (param: 'closeFrom' | 'closeTo', label: string, value?: string) => (
    <FilterChip
      label={label}
      value={value && formatDate(value, locale)}
      clearHref={listHref(props.path, props.query, { [param]: undefined })}
    >
      <DateFilter
        id={`deals-${param}`}
        label={label}
        param={param}
        path={props.path}
        query={props.query}
        timeZone={props.timeZone}
      />
    </FilterChip>
  );

  return (
    <ListToolbar
      label={t('toolbar_label')}
      // The board counts only the filters it takes.
      filters={
        props.view === 'list'
          ? filterCount(props.query) - (props.query.filters.view ? 1 : 0)
          : [props.query.unassigned, props.query.filters.ownerId, companyId].filter(
              (value) => value !== undefined,
            ).length
      }
      search={
        <SearchBox
          id="deals-search"
          label={t('search_label')}
          placeholder={t('search_placeholder')}
          param="q"
          path={props.path}
          query={props.query}
          hideLabel
          className="min-w-40 basis-60 md:max-w-56 md:flex-none"
        />
      }
      end={
        <ExportButton
          workspaceId={props.workspace.id}
          permissions={props.workspace.permissions}
          list="deals"
          params={props.query.params}
        />
      }
    >
      <OwnerFilter
        id="deals-owner"
        chip
        me={props.me}
        members={props.members}
        path={props.path}
        query={props.query}
      />
      <FilterChip
        label={t('company_label')}
        value={company?.label}
        clearHref={listHref(props.path, props.query, { companyId: undefined })}
      >
        <RecordFilter
          id="deals-company"
          label={t('company_label')}
          placeholder={t('company_any')}
          workspaceId={props.workspace.id}
          kind="company"
          param="companyId"
          value={company}
          path={props.path}
          query={props.query}
        />
      </FilterChip>
      {props.view === 'list' && (
        <>
          <FilterChip
            label={t('contact_label')}
            value={contact?.label}
            clearHref={listHref(props.path, props.query, { contactId: undefined })}
          >
            <RecordFilter
              id="deals-contact"
              label={t('contact_label')}
              placeholder={t('contact_any')}
              workspaceId={props.workspace.id}
              kind="contact"
              param="contactId"
              value={contact}
              path={props.path}
              query={props.query}
            />
          </FilterChip>
          <OptionsChip
            label={t('stage_label')}
            anyLabel={t('stage_any')}
            missingLabel={t('stage_unknown')}
            param="stageId"
            options={props.stages.map((stage) => ({ value: String(stage.id), label: stage.name }))}
            path={props.path}
            query={props.query}
          />
          <OptionsChip
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
          {closeChip('closeFrom', t('close_from_label'), closeFrom)}
          {closeChip('closeTo', t('close_to_label'), closeTo)}
          <GroupMenu
            options={[
              { group: 'stage', label: tList('group_stage') },
              { group: 'owner', label: tList('group_owner') },
            ]}
            defaultGroup="stage"
            path={props.path}
            query={props.query}
          />
          <SortMenu
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
        </>
      )}
      <MeToggle me={props.me} path={props.path} query={props.query} />
      {props.view === 'list' && <ArchivedToggle path={props.path} query={props.query} />}
    </ListToolbar>
  );
};

import { useTranslations } from 'next-intl';
import { ArchivedToggle } from '@/components/crm/list/ArchivedToggle';
import { ExportButton } from '@/components/crm/list/ExportButton';
import { FilterChip, OptionsChip } from '@/components/crm/list/FilterChip';
import { GroupMenu } from '@/components/crm/list/GroupMenu';
import { ListToolbar } from '@/components/crm/list/ListToolbar';
import { MeToggle } from '@/components/crm/list/MeToggle';
import { OwnerFilter } from '@/components/crm/list/OwnerFilter';
import { RecordFilter } from '@/components/crm/list/RecordFilter';
import { SearchBox } from '@/components/crm/list/SearchBox';
import { SortMenu } from '@/components/crm/list/SortMenu';
import type { CONTACT_LIST } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { filterCount, listHref } from '@/libs/crm/ListQuery';
import type { Permission } from '@/libs/crm/Permissions';

/**
 * The contact list's toolbar: the text search; the company (a record picker), owner, source and
 * tag chips; the grouping (none or owner), the sort, "Me" and the archived view; the export.
 * @param props Component props.
 * @param props.workspace The workspace, with the caller's permissions (the export needs `EXPORT`).
 * @param props.workspace.id Its id; the company filter searches its companies.
 * @param props.workspace.permissions The caller's permissions.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @param props.me The caller.
 * @param props.members The workspace's members.
 * @param props.sources Every lead source, archived ones included.
 * @param props.tags The tags of the workspace's active contacts.
 * @param props.companyName The name of the company filtered by, when it was found.
 * @returns The toolbar.
 */
export const ContactFilters = (props: {
  workspace: { id: number; permissions: Permission[] };
  path: string;
  query: ListQuery<typeof CONTACT_LIST>;
  me: components['schemas']['UserResponse'];
  members: components['schemas']['MemberResponse'][];
  sources: components['schemas']['LeadSourceResponse'][];
  tags: string[];
  companyName?: string;
}) => {
  const t = useTranslations('ContactsPage');
  const tSource = useTranslations('SourceField');
  const tList = useTranslations('ListToolbar');
  const { companyId, tag } = props.query.filters;
  const company =
    companyId === undefined
      ? null
      : { id: companyId, label: props.companyName ?? t('company_unknown') };

  return (
    <ListToolbar
      label={t('toolbar_label')}
      filters={filterCount(props.query)}
      search={
        <SearchBox
          id="contacts-search"
          label={t('search_label')}
          placeholder={t('search_placeholder')}
          param="q"
          path={props.path}
          query={props.query}
          hideLabel
          className="min-w-40 basis-60 md:max-w-64 md:flex-none"
        />
      }
      end={
        <ExportButton
          workspaceId={props.workspace.id}
          permissions={props.workspace.permissions}
          list="contacts"
          params={props.query.params}
        />
      }
    >
      <FilterChip
        label={t('company_label')}
        value={company?.label}
        clearHref={listHref(props.path, props.query, { companyId: undefined })}
      >
        <RecordFilter
          id="contacts-company"
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
      <OwnerFilter
        id="contacts-owner"
        chip
        me={props.me}
        members={props.members}
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
      <OptionsChip
        label={t('tag_label')}
        anyLabel={t('tag_any')}
        // A tag no active contact has any more (only archived ones): named as it is.
        missingLabel={tag ?? ''}
        param="tag"
        options={props.tags.map((item) => ({ value: item, label: item }))}
        path={props.path}
        query={props.query}
      />
      <GroupMenu
        options={[{ group: 'owner', label: tList('group_owner') }]}
        path={props.path}
        query={props.query}
      />
      <SortMenu
        options={[
          { sort: 'NAME', label: tList('sort_name') },
          { sort: 'COMPANY', label: tList('sort_company') },
          { sort: 'CREATED_AT', label: tList('sort_created') },
          { sort: 'UPDATED_AT', label: tList('sort_updated') },
        ]}
        path={props.path}
        query={props.query}
      />
      <MeToggle me={props.me} path={props.path} query={props.query} />
      <ArchivedToggle path={props.path} query={props.query} />
    </ListToolbar>
  );
};

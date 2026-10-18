import { useTranslations } from 'next-intl';
import { ArchivedToggle } from '@/components/crm/list/ArchivedToggle';
import type { FilterOption } from '@/components/crm/list/FilterSelect';
import { FilterSelect } from '@/components/crm/list/FilterSelect';
import { ListToolbar } from '@/components/crm/list/ListToolbar';
import { OwnerFilter } from '@/components/crm/list/OwnerFilter';
import { RecordFilter } from '@/components/crm/list/RecordFilter';
import { SearchBox } from '@/components/crm/list/SearchBox';
import type { CONTACT_LIST } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import type { ListQuery } from '@/libs/crm/ListQuery';

/**
 * The contact list's search and filters: the text search, the company (a record picker), the
 * owner (Anyone, Me, Unassigned, each member), the source, the tag and the archived view.
 * @param props Component props.
 * @param props.workspaceId The workspace, whose companies the company filter searches.
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
  workspaceId: number;
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
  const { companyId, tag } = props.query.filters;
  const sourceOptions: FilterOption[] = props.sources.map((source) => ({
    value: String(source.id),
    label: source.archived ? tSource('archived', { name: source.name }) : source.name,
  }));

  return (
    <ListToolbar label={t('toolbar_label')}>
      <SearchBox
        id="contacts-search"
        label={t('search_label')}
        placeholder={t('search_placeholder')}
        param="q"
        path={props.path}
        query={props.query}
        // A row of its own: five filters would cut its placeholder short.
        className="basis-full"
      />
      <RecordFilter
        id="contacts-company"
        label={t('company_label')}
        placeholder={t('company_any')}
        workspaceId={props.workspaceId}
        kind="company"
        param="companyId"
        value={
          companyId === undefined
            ? null
            : { id: companyId, label: props.companyName ?? t('company_unknown') }
        }
        path={props.path}
        query={props.query}
      />
      <OwnerFilter
        id="contacts-owner"
        me={props.me}
        members={props.members}
        path={props.path}
        query={props.query}
      />
      <FilterSelect
        id="contacts-source"
        label={t('source_label')}
        anyLabel={t('source_any')}
        missingLabel={t('source_unknown')}
        param="sourceId"
        options={sourceOptions}
        path={props.path}
        query={props.query}
      />
      <FilterSelect
        id="contacts-tag"
        label={t('tag_label')}
        anyLabel={t('tag_any')}
        // A tag no active contact has any more (only archived ones): named as it is.
        missingLabel={tag ?? ''}
        param="tag"
        options={props.tags.map((item) => ({ value: item, label: item }))}
        path={props.path}
        query={props.query}
      />
      <ArchivedToggle path={props.path} query={props.query} />
    </ListToolbar>
  );
};

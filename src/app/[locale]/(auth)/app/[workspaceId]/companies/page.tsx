import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { addCompany } from '@/actions/crm/CompanyActions';
import { CompanyTable } from '@/components/crm/company/CompanyTable';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { ArchivedToggle } from '@/components/crm/list/ArchivedToggle';
import { ExportButton } from '@/components/crm/list/ExportButton';
import { FilterChip } from '@/components/crm/list/FilterChip';
import { GroupMenu } from '@/components/crm/list/GroupMenu';
import { InlineAddRow } from '@/components/crm/list/InlineAddRow';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListHeader } from '@/components/crm/list/ListHeader';
import { ListToolbar } from '@/components/crm/list/ListToolbar';
import { MeToggle } from '@/components/crm/list/MeToggle';
import { OwnerFilter } from '@/components/crm/list/OwnerFilter';
import { ownerSections, RecordList } from '@/components/crm/list/RecordList';
import { SearchBox } from '@/components/crm/list/SearchBox';
import { SortMenu } from '@/components/crm/list/SortMenu';
import { Button } from '@/components/ui/button';
import { COMPANY_LIST, getCompanies, getMembers } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import {
  filterCount,
  listHref,
  ownerGroups,
  parseListQuery,
  pastEndHref,
} from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign } from '@/libs/crm/RecordAccess';
import { Link, redirect } from '@/libs/I18nNavigation';

type CompaniesPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: CompaniesPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'CompaniesPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function CompaniesPage(props: CompaniesPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CompaniesPage' });
  const tList = await getTranslations({ locale, namespace: 'ListToolbar' });
  const query = parseListQuery(COMPANY_LIST, await props.searchParams);
  const { industry } = query.filters;
  const grouped = query.group === 'owner';

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, ungrouped, members] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    grouped ? undefined : getCompanies(workspaceId, query),
    getMembers(workspaceId),
  ]);
  if (ungrouped?.unauthorized || members.unauthorized) {
    return endRejectedSession(locale);
  }
  if (!workspace || !user || !members.members) {
    throw new Error('Could not load the companies');
  }
  // Grouped by owner: each group is read on its own (its first rows and its total), all at once.
  const groups = grouped ? ownerGroups(query, members.members, user.id) : [];
  const lists = ungrouped
    ? [ungrouped]
    : await Promise.all(groups.map(async (group) => await getCompanies(workspaceId, group.query)));
  if (lists.some((list) => list.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (lists.some((list) => list.forbidden)) {
    return <ForbiddenNotice page />;
  }
  if (lists.some((list) => !list.companies && !list.invalid)) {
    throw new Error('Could not load the companies');
  }
  const pages = lists.some((list) => list.invalid)
    ? undefined
    : lists.flatMap((list) => list.companies ?? []);
  const path = `/app/${workspace.id}/companies`;
  const last = pastEndHref(path, query, ungrouped?.companies);
  if (last) {
    return redirect({ href: last, locale });
  }
  const newCompany = (
    <Button asChild>
      <Link href={`${path}/new`}>
        <PlusIcon data-icon="inline-start" />
        {t('new')}
      </Link>
    </Button>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4">
      <ListHeader
        title={t('title')}
        count={pages?.reduce((sum, item) => sum + item.totalElements, 0)}
        action={newCompany}
      />

      <ListToolbar
        label={t('toolbar_label')}
        filters={filterCount(query)}
        search={
          <SearchBox
            id="companies-search"
            label={t('search_label')}
            placeholder={t('search_placeholder')}
            param="q"
            path={path}
            query={query}
            hideLabel
            className="min-w-40 basis-60 md:max-w-56 md:flex-none"
          />
        }
        end={
          <ExportButton
            workspaceId={workspace.id}
            permissions={workspace.permissions}
            list="companies"
            params={query.params}
          />
        }
      >
        <FilterChip
          label={t('industry_label')}
          value={industry}
          clearHref={listHref(path, query, { industry: undefined })}
        >
          <SearchBox
            id="companies-industry"
            label={t('industry_label')}
            placeholder={t('industry_placeholder')}
            param="industry"
            path={path}
            query={query}
          />
        </FilterChip>
        <OwnerFilter
          id="companies-owner"
          chip
          me={user}
          members={members.members}
          path={path}
          query={query}
        />
        <GroupMenu
          options={[{ group: 'owner', label: tList('group_owner') }]}
          path={path}
          query={query}
        />
        <SortMenu
          options={[
            { sort: 'NAME', label: tList('sort_name') },
            { sort: 'CREATED_AT', label: tList('sort_created') },
            { sort: 'UPDATED_AT', label: tList('sort_updated') },
          ]}
          path={path}
          query={query}
        />
        <MeToggle me={user} path={path} query={query} />
        <ArchivedToggle path={path} query={query} />
      </ListToolbar>

      {pages ? (
        <RecordList
          id="companies-heading"
          heading={(count) =>
            query.archived ? t('archived_heading', { count }) : t('list_heading', { count })
          }
          path={path}
          query={query}
          pages={pages}
          groups={grouped ? ownerSections(groups, user.id) : undefined}
          members={members.members}
          me={user.id}
          mayAssign={canAssign(workspace)}
          empty={{
            title: t('empty_title'),
            text: t('empty_text'),
            archivedText: t('archived_empty_text'),
            action: newCompany,
          }}
          table={(rows) => (
            <CompanyTable
              rows={rows}
              path={path}
              query={query}
              timeZone={workspace.timezone}
              workspace={workspace}
              me={user.id}
            />
          )}
          // A company by its name alone, in the list's industry.
          addRow={(owner) => (
            <InlineAddRow
              label={owner ? t('add_for', { name: owner.name }) : t('new')}
              placeholder={t('new')}
              action={addCompany.bind(null, workspace.id, {
                ownerId: owner?.userId ?? null,
                // As the records spell it, which the filter may not.
                industry: industry
                  ? (pages?.find((page) => page.content.length > 0)?.content[0]?.industry ??
                    industry)
                  : '',
              })}
            />
          )}
        />
      ) : (
        <InvalidFilterNotice resetHref={path} />
      )}
    </div>
  );
}

import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { CompanyTable } from '@/components/crm/company/CompanyTable';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { ArchivedToggle } from '@/components/crm/list/ArchivedToggle';
import type { FilterOption } from '@/components/crm/list/FilterSelect';
import { FilterSelect } from '@/components/crm/list/FilterSelect';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListEmpty } from '@/components/crm/list/ListEmpty';
import { ListPager } from '@/components/crm/list/ListPager';
import { ListToolbar } from '@/components/crm/list/ListToolbar';
import { SearchBox } from '@/components/crm/list/SearchBox';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { Button } from '@/components/ui/button';
import { COMPANY_LIST, getCompanies, getMembers } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { listHref, parseListQuery } from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
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
  const query = parseListQuery(COMPANY_LIST, await props.searchParams);

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, list, members] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getCompanies(workspaceId, query),
    getMembers(workspaceId),
  ]);
  if (list.unauthorized || members.unauthorized) {
    return endRejectedSession(locale);
  }
  if (list.forbidden) {
    return <ForbiddenNotice page />;
  }
  if (!workspace || !user || (!list.companies && !list.invalid) || !members.members) {
    throw new Error('Could not load the companies');
  }
  const path = `/app/${workspace.id}/companies`;
  const page = list.companies;
  // A page past the end (a hand-edited link, or rows archived meanwhile): the last one instead.
  if (page && page.content.length === 0 && page.totalPages > 0) {
    return redirect({
      href: listHref(path, query, { page: String(page.totalPages - 1) }),
      locale,
    });
  }
  const filtered =
    [query.q, query.archived, query.unassigned].some((value) => value !== undefined) ||
    Object.keys(query.filters).length > 0;
  const ownerOptions: FilterOption[] = [
    { value: String(user.id), label: t('owner_me'), person: user },
    { value: 'unassigned', label: t('owner_unassigned') },
    ...members.members
      .filter((member) => member.userId !== user.id)
      .map((member) => ({
        value: String(member.userId),
        label: member.displayName ?? member.email,
        person: member,
      })),
  ];
  const newCompany = (
    <Button asChild>
      <Link href={`${path}/new`}>
        <PlusIcon data-icon="inline-start" />
        {t('new')}
      </Link>
    </Button>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <SettingsHeader title={t('title')} description={t('description')} action={newCompany} />

      <ListToolbar label={t('toolbar_label')}>
        <SearchBox
          id="companies-search"
          label={t('search_label')}
          placeholder={t('search_placeholder')}
          param="q"
          path={path}
          query={query}
        />
        <SearchBox
          id="companies-industry"
          label={t('industry_label')}
          placeholder={t('industry_placeholder')}
          param="industry"
          path={path}
          query={query}
        />
        <FilterSelect
          id="companies-owner"
          label={t('owner_label')}
          anyLabel={t('owner_any')}
          param="ownerId"
          options={ownerOptions}
          path={path}
          query={query}
        />
        <ArchivedToggle path={path} query={query} />
      </ListToolbar>

      {page ? (
        <section
          aria-labelledby="companies-heading"
          className="overflow-hidden rounded-lg border border-rule bg-card"
        >
          <h2 id="companies-heading" className="px-4 pt-4 pb-3 font-semibold sm:px-5">
            {query.archived
              ? t('archived_heading', { count: page.totalElements })
              : t('list_heading', { count: page.totalElements })}
          </h2>
          {page.content.length > 0 && (
            <>
              <div className="border-t border-rule">
                <CompanyTable
                  rows={page.content}
                  path={path}
                  query={query}
                  timeZone={workspace.timezone}
                />
              </div>
              <ListPager path={path} query={query} total={page.totalElements} />
            </>
          )}
          {page.content.length === 0 &&
            (filtered ? (
              <ListEmpty variant="filtered" clearHref={path} />
            ) : (
              <ListEmpty
                variant="none"
                title={t('empty_title')}
                text={t('empty_text')}
                action={newCompany}
              />
            ))}
        </section>
      ) : (
        <InvalidFilterNotice resetHref={path} />
      )}
    </div>
  );
}

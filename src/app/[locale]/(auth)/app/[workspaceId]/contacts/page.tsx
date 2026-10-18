import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactFilters } from '@/components/crm/contact/ContactFilters';
import { ContactTable } from '@/components/crm/contact/ContactTable';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListEmpty } from '@/components/crm/list/ListEmpty';
import { ListPager } from '@/components/crm/list/ListPager';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { Button } from '@/components/ui/button';
import {
  CONTACT_LIST,
  getCompany,
  getContacts,
  getContactTags,
  getLeadSources,
  getMembers,
} from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { listHref, parseListQuery } from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { Link, redirect } from '@/libs/I18nNavigation';

type ContactsPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: ContactsPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'ContactsPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function ContactsPage(props: ContactsPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ContactsPage' });
  const query = parseListQuery(CONTACT_LIST, await props.searchParams);
  const { companyId } = query.filters;

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, list, members, sources, tags, company] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getContacts(workspaceId, query),
    getMembers(workspaceId),
    getLeadSources(workspaceId),
    getContactTags(workspaceId),
    // The company filter's name, which the picker shows without a search.
    companyId === undefined ? undefined : getCompany(workspaceId, String(companyId)),
  ]);
  if ([list, members, sources, tags, company].some((result) => result?.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (list.forbidden) {
    return <ForbiddenNotice page />;
  }
  if (
    !workspace ||
    !user ||
    (!list.contacts && !list.invalid) ||
    !members.members ||
    !sources.sources ||
    !tags.tags
  ) {
    throw new Error('Could not load the contacts');
  }
  const path = `/app/${workspace.id}/contacts`;
  const page = list.contacts;
  // A page past the end (a hand-edited link, or rows archived meanwhile): the last one instead.
  if (page && page.content.length === 0 && page.totalPages > 0) {
    return redirect({
      href: listHref(path, query, {
        page: page.totalPages > 1 ? String(page.totalPages - 1) : undefined,
      }),
      locale,
    });
  }
  const filtered = [query.q, query.unassigned, ...Object.values(query.filters)].some(
    (value) => value !== undefined,
  );
  const newContact = (
    <Button asChild>
      <Link href={`${path}/new`}>
        <PlusIcon data-icon="inline-start" />
        {t('new')}
      </Link>
    </Button>
  );
  // Without rows: nothing matches the search and filters, the archive is empty, or nothing yet.
  let empty = (
    <ListEmpty variant="none" title={t('empty_title')} text={t('empty_text')} action={newContact} />
  );
  if (filtered) {
    empty = <ListEmpty variant="filtered" clearHref={path} />;
  } else if (query.archived) {
    empty = (
      <ListEmpty
        variant="archived"
        text={t('archived_empty_text')}
        activeHref={listHref(path, query, { archived: undefined })}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <SettingsHeader title={t('title')} description={t('description')} action={newContact} />

      <ContactFilters
        workspaceId={workspace.id}
        path={path}
        query={query}
        me={user}
        members={members.members}
        sources={sources.sources}
        tags={tags.tags}
        company={company}
      />

      {page ? (
        <section
          aria-labelledby="contacts-heading"
          className="overflow-hidden rounded-lg border border-rule bg-card"
        >
          <h2 id="contacts-heading" className="px-4 pt-4 pb-3 font-semibold sm:px-5">
            {query.archived
              ? t('archived_heading', { count: page.totalElements })
              : t('list_heading', { count: page.totalElements })}
          </h2>
          {page.content.length > 0 ? (
            <>
              <div className="border-t border-rule">
                <ContactTable
                  rows={page.content}
                  path={path}
                  companiesPath={`/app/${workspace.id}/companies`}
                  query={query}
                  timeZone={workspace.timezone}
                />
              </div>
              <ListPager path={path} query={query} total={page.totalElements} />
            </>
          ) : (
            empty
          )}
        </section>
      ) : (
        <InvalidFilterNotice resetHref={path} />
      )}
    </div>
  );
}

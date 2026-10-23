import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ContactFilters } from '@/components/crm/contact/ContactFilters';
import { ContactTable } from '@/components/crm/contact/ContactTable';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { InlineAddRow } from '@/components/crm/list/InlineAddRow';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListHeader } from '@/components/crm/list/ListHeader';
import { ownerSections, RecordList } from '@/components/crm/list/RecordList';
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
import { ownerGroups, parseListQuery, pastEndHref } from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign } from '@/libs/crm/RecordAccess';
import { Link, redirect } from '@/libs/I18nNavigation';

type ContactsPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * The company filter's name, which the picker shows without a search.
 * @param lookup The company's lookup, when the list is filtered by one.
 * @returns Its name, when it was found.
 */
const nameOf = (lookup?: Awaited<ReturnType<typeof getCompany>>) => lookup?.company?.name;

/**
 * The new contact form, filled in with a company and an owner.
 * @param path The contact list's path.
 * @param companyId The company, if any.
 * @param ownerId The owner, if any (the form keeps it only for a role that may give it).
 * @returns The form's link.
 */
const newContactHref = (path: string, companyId?: number, ownerId?: number) => {
  const prefill = new URLSearchParams();
  if (companyId !== undefined) {
    prefill.set('companyId', String(companyId));
  }
  if (ownerId !== undefined) {
    prefill.set('ownerId', String(ownerId));
  }
  const search = prefill.toString();

  return search ? `${path}/new?${search}` : `${path}/new`;
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
  const grouped = query.group === 'owner';

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, ungrouped, members, sources, tags, company] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    grouped ? undefined : getContacts(workspaceId, query),
    getMembers(workspaceId),
    getLeadSources(workspaceId),
    getContactTags(workspaceId),
    // The company filter's name, which the picker shows without a search.
    companyId === undefined ? undefined : getCompany(workspaceId, String(companyId)),
  ]);
  if ([ungrouped, members, sources, tags, company].some((result) => result?.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (!workspace || !user || !members.members || !sources.sources || !tags.tags) {
    throw new Error('Could not load the contacts');
  }
  // Grouped by owner: each group is read on its own (its first rows and its total), all at once.
  const groups = grouped ? ownerGroups(query, members.members, user.id) : [];
  const lists = ungrouped
    ? [ungrouped]
    : await Promise.all(groups.map(async (group) => await getContacts(workspaceId, group.query)));
  if (lists.some((list) => list.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (lists.some((list) => list.forbidden)) {
    return <ForbiddenNotice page />;
  }
  if (lists.some((list) => !list.contacts && !list.invalid)) {
    throw new Error('Could not load the contacts');
  }
  const pages = lists.some((list) => list.invalid)
    ? undefined
    : lists.flatMap((list) => list.contacts ?? []);
  const path = `/app/${workspace.id}/contacts`;
  const last = pastEndHref(path, query, ungrouped?.contacts);
  if (last) {
    return redirect({ href: last, locale });
  }
  const newContact = (
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
        action={newContact}
      />

      <ContactFilters
        workspace={workspace}
        path={path}
        query={query}
        me={user}
        members={members.members}
        sources={sources.sources}
        tags={tags.tags}
        companyName={nameOf(company)}
      />

      {pages ? (
        <RecordList
          id="contacts-heading"
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
            action: newContact,
          }}
          table={(rows) => (
            <ContactTable
              rows={rows}
              path={path}
              companiesPath={`/app/${workspace.id}/companies`}
              query={query}
              timeZone={workspace.timezone}
              workspace={workspace}
              me={user.id}
            />
          )}
          // The form, filled in with the list's company and the group's owner.
          addRow={(owner) => (
            <InlineAddRow
              label={owner ? t('add_for', { name: owner.name }) : t('new')}
              href={newContactHref(path, companyId, owner?.userId)}
            />
          )}
        />
      ) : (
        <InvalidFilterNotice resetHref={path} />
      )}
    </div>
  );
}

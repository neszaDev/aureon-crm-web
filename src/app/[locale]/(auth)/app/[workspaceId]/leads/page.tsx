import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { LeadFilters } from '@/components/crm/lead/LeadFilters';
import { LeadTable } from '@/components/crm/lead/LeadTable';
import { ExportButton } from '@/components/crm/list/ExportButton';
import { InvalidFilterNotice } from '@/components/crm/list/InvalidFilterNotice';
import { ListEmpty } from '@/components/crm/list/ListEmpty';
import { ListPager } from '@/components/crm/list/ListPager';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { Button } from '@/components/ui/button';
import { getLeads, getLeadSources, getMembers, LEAD_LIST } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { isFiltered, listHref, parseListQuery } from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { todayIn } from '@/libs/crm/ZonedTime';
import { Link, redirect } from '@/libs/I18nNavigation';

type LeadsPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: LeadsPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'LeadsPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function LeadsPage(props: LeadsPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'LeadsPage' });
  const query = parseListQuery(LEAD_LIST, await props.searchParams);

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, list, members, sources] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getLeads(workspaceId, query),
    getMembers(workspaceId),
    getLeadSources(workspaceId),
  ]);
  if ([list, members, sources].some((result) => result.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (list.forbidden) {
    return <ForbiddenNotice page />;
  }
  if (
    !workspace ||
    !user ||
    (!list.leads && !list.invalid) ||
    !members.members ||
    !sources.sources
  ) {
    throw new Error('Could not load the leads');
  }
  const path = `/app/${workspace.id}/leads`;
  const page = list.leads;
  // A page past the end (a hand-edited link, or rows archived meanwhile): the last one instead.
  if (page && page.content.length === 0 && page.totalPages > 0) {
    return redirect({
      href: listHref(path, query, {
        page: page.totalPages > 1 ? String(page.totalPages - 1) : undefined,
      }),
      locale,
    });
  }
  const newLead = (
    <Button asChild>
      <Link href={`${path}/new`}>
        <PlusIcon data-icon="inline-start" />
        {t('new')}
      </Link>
    </Button>
  );
  // Without rows: nothing matches the search and filters, the archive is empty, or nothing yet.
  let empty = (
    <ListEmpty variant="none" title={t('empty_title')} text={t('empty_text')} action={newLead} />
  );
  if (isFiltered(query)) {
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
      <SettingsHeader
        title={t('title')}
        description={t('description')}
        action={
          <>
            <ExportButton
              workspaceId={workspace.id}
              permissions={workspace.permissions}
              list="leads"
              params={query.params}
            />
            {newLead}
          </>
        }
      />

      <LeadFilters
        path={path}
        query={query}
        me={user}
        members={members.members}
        sources={sources.sources}
        timeZone={workspace.timezone}
      />

      {page ? (
        <section
          aria-labelledby="leads-heading"
          className="overflow-hidden rounded-lg border border-rule bg-card"
        >
          <h2 id="leads-heading" className="px-4 pt-4 pb-3 font-semibold sm:px-5">
            {query.archived
              ? t('archived_heading', { count: page.totalElements })
              : t('list_heading', { count: page.totalElements })}
          </h2>
          {page.content.length > 0 ? (
            <>
              <div className="border-t border-rule">
                <LeadTable
                  rows={page.content}
                  path={path}
                  query={query}
                  timeZone={workspace.timezone}
                  today={todayIn(workspace.timezone)}
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

import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DealFilters } from '@/components/crm/deal/DealFilters';
import { DealsBoardSection } from '@/components/crm/deal/DealsBoardSection';
import { DealsListSection } from '@/components/crm/deal/DealsListSection';
import { ListHeader } from '@/components/crm/list/ListHeader';
import { ViewTabs } from '@/components/crm/list/ViewTabs';
import { Button } from '@/components/ui/button';
import {
  DEAL_LIST,
  getCompany,
  getContact,
  getLeadSources,
  getMembers,
  getStages,
} from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { listHref, parseListQuery } from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { Link } from '@/libs/I18nNavigation';
import { DEAL_VIEWS, DEFAULT_DEAL_VIEW } from '@/validations/crm/DealValidation';

type DealsPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: DealsPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'DealsPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function DealsPage(props: DealsPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'DealsPage' });
  const query = parseListQuery(DEAL_LIST, await props.searchParams);
  const view = query.filters.view ?? DEFAULT_DEAL_VIEW;
  const { companyId, contactId } = query.filters;

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, members, stages, sources, company, contact] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getMembers(workspaceId),
    getStages(workspaceId),
    getLeadSources(workspaceId),
    // The filters' names, which the pickers show without a search.
    companyId === undefined ? undefined : getCompany(workspaceId, String(companyId)),
    contactId === undefined ? undefined : getContact(workspaceId, String(contactId)),
  ]);
  if ([members, stages, sources, company, contact].some((result) => result?.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (!workspace || !user || !members.members || !stages.stages || !sources.sources) {
    throw new Error('Could not load the deals');
  }
  const path = `/app/${workspace.id}/deals`;
  const newDeal = (
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
        action={newDeal}
        tabs={
          <ViewTabs
            label={t('views_label')}
            tabs={DEAL_VIEWS.map((item) => ({
              key: item,
              label: t(`view_${item}`),
              href: listHref(path, query, { view: item === DEFAULT_DEAL_VIEW ? undefined : item }),
              current: item === view,
            }))}
          />
        }
      />

      <DealFilters
        workspace={workspace}
        view={view}
        path={path}
        query={query}
        me={user}
        members={members.members}
        stages={stages.stages}
        sources={sources.sources}
        companyName={company?.company?.name}
        contactName={contact?.contact?.fullName}
        timeZone={workspace.timezone}
      />

      {view === 'board' ? (
        <DealsBoardSection
          workspace={workspace}
          me={user.id}
          query={query}
          path={path}
          newDeal={newDeal}
        />
      ) : (
        <DealsListSection
          workspace={workspace}
          me={user.id}
          members={members.members}
          stages={stages.stages}
          query={query}
          path={path}
          newDeal={newDeal}
        />
      )}
    </div>
  );
}

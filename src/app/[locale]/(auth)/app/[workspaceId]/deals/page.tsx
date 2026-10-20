import { cn } from 'cn';
import { PlusIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DealFilters } from '@/components/crm/deal/DealFilters';
import { DealsBoardSection } from '@/components/crm/deal/DealsBoardSection';
import { DealsListSection } from '@/components/crm/deal/DealsListSection';
import { ExportButton } from '@/components/crm/list/ExportButton';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { Button } from '@/components/ui/button';
import { DEAL_LIST, getCompany, getContact, getMembers, getStages } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { listHref, parseListQuery } from '@/libs/crm/ListQuery';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { Link } from '@/libs/I18nNavigation';
import { DEAL_VIEWS } from '@/validations/crm/DealValidation';

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
  const view = query.filters.view ?? 'board';
  const { companyId, contactId } = query.filters;

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, members, stages, company, contact] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getMembers(workspaceId),
    getStages(workspaceId),
    // The filters' names, which the pickers show without a search.
    companyId === undefined ? undefined : getCompany(workspaceId, String(companyId)),
    contactId === undefined ? undefined : getContact(workspaceId, String(contactId)),
  ]);
  if ([members, stages, company, contact].some((result) => result?.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (!workspace || !user || !members.members || !stages.stages) {
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
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <SettingsHeader
        title={t('title')}
        description={t('description')}
        action={
          <>
            <ExportButton
              workspaceId={workspace.id}
              permissions={workspace.permissions}
              list="deals"
              query={query}
            />
            {newDeal}
          </>
        }
      />

      <nav aria-label={t('views_label')} className="flex flex-wrap gap-1 border-b border-rule">
        {DEAL_VIEWS.map((item) => (
          <Link
            key={item}
            href={listHref(path, query, { view: item === 'board' ? undefined : item })}
            aria-current={item === view ? 'page' : undefined}
            scroll={false}
            className={cn(
              '-mb-px flex min-h-9 items-center border-b-2 px-3 text-sm font-medium no-underline transition-colors duration-150',
              item === view
                ? 'border-seal-ink font-semibold text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {t(`view_${item}`)}
          </Link>
        ))}
      </nav>

      <DealFilters
        workspaceId={workspace.id}
        view={view}
        path={path}
        query={query}
        me={user}
        members={members.members}
        stages={stages.stages}
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
        <DealsListSection workspace={workspace} query={query} path={path} newDeal={newDeal} />
      )}
    </div>
  );
}

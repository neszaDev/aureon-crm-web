import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  createLeadSource,
  deleteLeadSource,
  updateLeadSource,
} from '@/actions/crm/LeadSourceActions';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { SourceList } from '@/components/crm/settings/SourceList';
import { getLeadSources } from '@/libs/api/CrmQueries';
import { endRejectedSession } from '@/libs/api/Session';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { can } from '@/libs/crm/Permissions';

type SourcesPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
};

export async function generateMetadata(props: SourcesPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'SourcesPage' });
  const { forbidden } = await getLeadSources(workspaceId);

  return await workspacePageMetadata({ locale, workspaceId, title: t('title'), forbidden });
}

export default async function SourcesPage(props: SourcesPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'SourcesPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, sources] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getLeadSources(workspaceId),
  ]);
  if (sources.unauthorized) {
    return endRejectedSession(locale);
  }
  if (sources.forbidden) {
    return <ForbiddenNotice page />;
  }
  if (!workspace || !sources.sources) {
    throw new Error('Could not load the lead sources');
  }
  const canManage = can(workspace, 'SETTINGS_MANAGE');
  const rows = sources.sources;

  return (
    <>
      <SettingsHeader title={t('title')} description={t('description')} />
      <section
        aria-labelledby="sources-heading"
        className="overflow-hidden rounded-lg border border-rule bg-card"
      >
        <h2
          id="sources-heading"
          tabIndex={-1}
          className="px-4 pt-4 pb-3 font-semibold focus-visible:-outline-offset-2 sm:px-5"
        >
          {t('sources_heading', { count: rows.length })}
        </h2>
        {!canManage && (
          <p className="px-4 pb-3 text-sm text-muted-foreground sm:px-5">{t('read_only')}</p>
        )}
        <SourceList
          sources={rows}
          canManage={canManage}
          headingId="sources-heading"
          actions={{
            create: createLeadSource.bind(null, workspace.id),
            update: updateLeadSource.bind(null, workspace.id),
            remove: deleteLeadSource.bind(null, workspace.id),
          }}
        />
      </section>
    </>
  );
}

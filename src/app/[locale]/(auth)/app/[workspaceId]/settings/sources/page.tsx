import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  createLeadSource,
  deleteLeadSource,
  updateLeadSource,
} from '@/actions/crm/LeadSourceActions';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { SettingsHeader, SettingsSection } from '@/components/crm/settings/SettingsHeader';
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
      <SettingsSection
        headingId="sources-heading"
        title={t('sources_heading', { count: rows.length })}
        description={canManage ? undefined : t('read_only')}
      >
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
      </SettingsSection>
    </>
  );
}

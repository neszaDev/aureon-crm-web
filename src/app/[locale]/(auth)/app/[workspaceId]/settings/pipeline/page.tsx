import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import {
  createStage,
  deleteStage,
  reorderStages,
  updateStage,
} from '@/actions/crm/PipelineActions';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { SettingsHeader, SettingsSection } from '@/components/crm/settings/SettingsHeader';
import { StageList } from '@/components/crm/settings/StageList';
import { getStages } from '@/libs/api/CrmQueries';
import { endRejectedSession } from '@/libs/api/Session';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { can } from '@/libs/crm/Permissions';
import { toStages } from '@/libs/crm/Stages';

type PipelinePageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
};

export async function generateMetadata(props: PipelinePageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'PipelinePage' });
  const { forbidden } = await getStages(workspaceId);

  return await workspacePageMetadata({ locale, workspaceId, title: t('title'), forbidden });
}

export default async function PipelinePage(props: PipelinePageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'PipelinePage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, stages] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getStages(workspaceId),
  ]);
  if (stages.unauthorized) {
    return endRejectedSession(locale);
  }
  if (stages.forbidden) {
    return <ForbiddenNotice page />;
  }
  if (!workspace || !stages.stages) {
    throw new Error('Could not load the pipeline');
  }
  const canManage = can(workspace, 'SETTINGS_MANAGE');

  return (
    <>
      <SettingsHeader title={t('title')} description={t('description')} />
      <SettingsSection
        headingId="stages-heading"
        title={t('stages_heading')}
        description={canManage ? undefined : t('read_only')}
      >
        <StageList
          stages={toStages(stages.stages)}
          canManage={canManage}
          headingId="stages-heading"
          actions={{
            create: createStage.bind(null, workspace.id),
            update: updateStage.bind(null, workspace.id),
            reorder: reorderStages.bind(null, workspace.id),
            remove: deleteStage.bind(null, workspace.id),
          }}
        />
      </SettingsSection>
    </>
  );
}

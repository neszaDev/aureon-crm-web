import { PencilIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { archiveDeal, restoreDeal } from '@/actions/crm/DealActions';
import { RecordHistory } from '@/components/crm/audit/RecordHistory';
import { DealFacts } from '@/components/crm/deal/DealFacts';
import { DealStagePill } from '@/components/crm/deal/DealStagePill';
import { StageHistory } from '@/components/crm/deal/StageHistory';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { ArchiveButton } from '@/components/crm/record/ArchiveButton';
import { LogActivityButton } from '@/components/crm/record/LogActivityButton';
import { RecordHeader } from '@/components/crm/record/RecordHeader';
import { RecordPage } from '@/components/crm/record/RecordLayout';
import { RecordNotFound } from '@/components/crm/record/RecordNotFound';
import { RecordWork } from '@/components/crm/record/RecordWork';
import { StatusTrack } from '@/components/crm/StatusTrack';
import { Button } from '@/components/ui/button';
import { getDeal, getDealHistory, getStages } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { stageSignatures } from '@/libs/crm/DealHistory';
import { formatMoney, recordNumber } from '@/libs/crm/Format';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canEditRecord } from '@/libs/crm/RecordAccess';
import { Link } from '@/libs/I18nNavigation';

type DealPageProps = {
  params: Promise<{ locale: string; workspaceId: string; id: string }>;
};

const HEADING_ID = 'deal-heading';

export async function generateMetadata(props: DealPageProps): Promise<Metadata> {
  const { locale, workspaceId, id } = await props.params;
  const t = await getTranslations({ locale, namespace: 'RecordNotFound' });
  const { deal, forbidden } = await getDeal(workspaceId, id);

  return await workspacePageMetadata({
    locale,
    workspaceId,
    title: deal?.name ?? t('title'),
    forbidden,
  });
}

// Its full page, and its panel over the page it was opened from (`@panel`).
export default async function DealPage(props: DealPageProps) {
  const { locale, workspaceId, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'DealPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, result, history, stages] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getDeal(workspaceId, id),
    getDealHistory(workspaceId, id),
    getStages(workspaceId),
  ]);
  if ([result, history, stages].some((item) => item.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  const path = `/app/${workspace.id}/deals`;
  if (result.notFound) {
    return <RecordNotFound href={path} backLabel={t('back')} />;
  }
  if (result.forbidden || history.forbidden) {
    return <ForbiddenNotice page />;
  }
  const { deal } = result;
  if (!deal || !user || !history.history || !stages.stages) {
    throw new Error('Could not load the deal');
  }
  const canEdit = canEditRecord(workspace, user.id, deal.owner?.userId);
  const stageRefs = stages.stages.map(({ id: stageId, name, kind }) => ({
    id: stageId,
    name,
    kind,
  }));

  const actions = (
    <>
      {canEdit && (
        <>
          <Button asChild variant="outline">
            <Link href={`${path}/${deal.id}/edit`}>
              <PencilIcon data-icon="inline-start" />
              {t('edit')}
            </Link>
          </Button>
          <ArchiveButton
            id="deal-restore"
            name={deal.name}
            archived={deal.archived}
            archive={archiveDeal.bind(null, workspace.id, deal.id)}
            restore={restoreDeal.bind(null, workspace.id, deal.id)}
          />
        </>
      )}
      <LogActivityButton />
    </>
  );

  return (
    <RecordPage
      header={
        <RecordHeader
          number={recordNumber('deal', deal.id)}
          name={deal.name}
          headingId={HEADING_ID}
          owner={deal.owner}
          archived={deal.archived}
          // The stage as its pill, which moves the deal (Lost asks why first).
          status={
            <DealStagePill
              workspaceId={workspace.id}
              deal={{ id: deal.id, name: deal.name, version: deal.version, stage: deal.stage }}
              stages={stageRefs}
              canEdit={canEdit}
            />
          }
          figure={formatMoney(deal.amount, deal.currency, locale)}
          track={
            <StatusTrack
              stages={stageRefs}
              stage={deal.stage}
              enteredAt={deal.stageEnteredAt}
              signatures={stageSignatures(history.history)}
              now={new Date()}
              timeZone={workspace.timezone}
              full
            />
          }
          actions={actions}
        />
      }
    >
      {/* Its tasks and activity; they show on its company's page too. */}
      <RecordWork
        workspace={workspace}
        me={user.id}
        link={{ dealId: deal.id }}
        label={deal.name}
        facts={<DealFacts deal={deal} workspaceId={workspace.id} timeZone={workspace.timezone} />}
        history={
          <>
            <StageHistory history={history.history} timeZone={workspace.timezone} />
            <RecordHistory workspace={workspace} entityType="DEAL" entityId={deal.id} />
          </>
        }
      />
    </RecordPage>
  );
}

import { PencilIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { archiveLead, restoreLead } from '@/actions/crm/LeadActions';
import { currencyOptions } from '@/components/crm/CreateWorkspaceForm';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { ConversionSummary } from '@/components/crm/lead/ConversionSummary';
import { ConvertDialog } from '@/components/crm/lead/ConvertDialog';
import { LeadDetails } from '@/components/crm/lead/LeadDetails';
import { LeadLifecycle } from '@/components/crm/lead/LeadLifecycle';
import { LeadStatusMenu } from '@/components/crm/lead/LeadStatusMenu';
import { ArchiveButton } from '@/components/crm/record/ArchiveButton';
import { RecordHeader } from '@/components/crm/record/RecordHeader';
import { RecordNotFound } from '@/components/crm/record/RecordNotFound';
import { RecordWork } from '@/components/crm/record/RecordWork';
import { Button } from '@/components/ui/button';
import { getLead, getStages } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { fullName, recordNumber } from '@/libs/crm/Format';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canEditRecord } from '@/libs/crm/RecordAccess';
import { Link } from '@/libs/I18nNavigation';

type LeadPageProps = {
  params: Promise<{ locale: string; workspaceId: string; id: string }>;
};

const HEADING_ID = 'lead-heading';

export async function generateMetadata(props: LeadPageProps): Promise<Metadata> {
  const { locale, workspaceId, id } = await props.params;
  const t = await getTranslations({ locale, namespace: 'RecordNotFound' });
  const { lead, forbidden } = await getLead(workspaceId, id);

  return await workspacePageMetadata({
    locale,
    workspaceId,
    title: lead ? fullName(lead) : t('title'),
    forbidden,
  });
}

export default async function LeadPage(props: LeadPageProps) {
  const { locale, workspaceId, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'LeadPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, result] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getLead(workspaceId, id),
  ]);
  if (result.unauthorized) {
    return endRejectedSession(locale);
  }
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  const path = `/app/${workspace.id}/leads`;
  if (result.notFound) {
    return <RecordNotFound href={path} backLabel={t('back')} />;
  }
  if (result.forbidden) {
    return <ForbiddenNotice page />;
  }
  const { lead } = result;
  if (!lead || !user) {
    throw new Error('Could not load the lead');
  }
  const canEdit = canEditRecord(workspace, user.id, lead.owner?.userId);
  const converted = lead.status === 'CONVERTED';
  // Only a qualified lead converts, and the dialog offers the open stages for its deal.
  const stages = canEdit && lead.status === 'QUALIFIED' ? await getStages(workspaceId) : undefined;
  if (stages?.unauthorized) {
    return endRejectedSession(locale);
  }
  // Without them the Convert button would just be missing.
  if (stages && !stages.stages) {
    throw new Error('Could not load the pipeline stages');
  }
  const name = fullName(lead);

  const actions = canEdit && (
    <>
      {stages?.stages && (
        <ConvertDialog
          workspaceId={workspace.id}
          lead={lead}
          stages={stages.stages.filter((stage) => stage.kind === 'OPEN')}
          defaultCurrency={workspace.defaultCurrency}
          currencies={currencyOptions(locale)}
          timeZone={workspace.timezone}
          headingId={HEADING_ID}
        />
      )}
      {!converted && <LeadStatusMenu workspaceId={workspace.id} lead={lead} name={name} />}
      {!converted && (
        <Button asChild variant="outline">
          <Link href={`${path}/${lead.id}/edit`}>
            <PencilIcon data-icon="inline-start" />
            {t('edit')}
          </Link>
        </Button>
      )}
      <ArchiveButton
        id="lead-restore"
        name={name}
        archived={lead.archived}
        archive={archiveLead.bind(null, workspace.id, lead.id)}
        restore={restoreLead.bind(null, workspace.id, lead.id)}
      />
    </>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <RecordHeader
        number={recordNumber('lead', lead.id)}
        name={name}
        headingId={HEADING_ID}
        owner={lead.owner}
        archived={lead.archived}
        actions={actions}
      />
      <LeadLifecycle status={lead.status} reason={lead.unqualifiedReason} />
      {converted && (
        <ConversionSummary
          workspaceId={workspace.id}
          company={lead.convertedCompany}
          contact={lead.convertedContact}
          deal={lead.convertedDeal}
        />
      )}
      <LeadDetails lead={lead} timeZone={workspace.timezone} />
      {/* Its tasks and activity; on a converted lead they show on its contact too. */}
      <RecordWork workspace={workspace} me={user.id} link={{ leadId: lead.id }} label={name} />
    </div>
  );
}

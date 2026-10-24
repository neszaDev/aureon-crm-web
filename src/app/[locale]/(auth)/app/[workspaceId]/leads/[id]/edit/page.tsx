import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { updateLead } from '@/actions/crm/LeadActions';
import { currencyOptions } from '@/components/crm/CreateWorkspaceForm';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { LeadForm } from '@/components/crm/lead/LeadForm';
import { RecordFormPage } from '@/components/crm/record/RecordLayout';
import { RecordNotFound } from '@/components/crm/record/RecordNotFound';
import { getLead, getLeadSources, getMembers, getWorkspace } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { fullName, recordNumber } from '@/libs/crm/Format';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign, canEditRecord } from '@/libs/crm/RecordAccess';
import { redirect } from '@/libs/I18nNavigation';
import { leadValues } from '@/validations/crm/LeadValidation';

type EditLeadPageProps = {
  params: Promise<{ locale: string; workspaceId: string; id: string }>;
};

export async function generateMetadata(props: EditLeadPageProps): Promise<Metadata> {
  const { locale, workspaceId, id } = await props.params;
  const t = await getTranslations({ locale, namespace: 'EditLeadPage' });
  const tNotFound = await getTranslations({ locale, namespace: 'RecordNotFound' });
  // The same cached calls as the page, which shows ForbiddenNotice to a member who can't edit.
  const [{ lead, forbidden }, { user }, { workspace }] = await Promise.all([
    getLead(workspaceId, id),
    getCurrentUser(),
    getWorkspace(workspaceId),
  ]);
  const refused =
    lead && user && workspace && !canEditRecord(workspace, user.id, lead.owner?.userId);

  return await workspacePageMetadata({
    locale,
    workspaceId,
    title: lead ? t('title', { name: fullName(lead) }) : tNotFound('title'),
    forbidden: forbidden || refused,
  });
}

export default async function EditLeadPage(props: EditLeadPageProps) {
  const { locale, workspaceId, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'EditLeadPage' });
  const tLead = await getTranslations({ locale, namespace: 'LeadPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, result, members, sources] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getLead(workspaceId, id),
    getMembers(workspaceId),
    getLeadSources(workspaceId),
  ]);
  if ([result, members, sources].some((item) => item.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  const path = `/app/${workspace.id}/leads`;
  if (result.notFound) {
    return <RecordNotFound href={path} backLabel={tLead('back')} />;
  }
  const { lead } = result;
  if (
    result.forbidden ||
    (lead && user && !canEditRecord(workspace, user.id, lead.owner?.userId))
  ) {
    return <ForbiddenNotice page />;
  }
  if (!lead || !user || !members.members || !sources.sources) {
    throw new Error('Could not load the lead');
  }
  // A converted lead can't be edited (the backend refuses it): its page shows what it became.
  if (lead.status === 'CONVERTED') {
    return redirect({ href: `${path}/${lead.id}`, locale });
  }

  return (
    <RecordFormPage
      number={recordNumber('lead', lead.id)}
      title={t('title', { name: fullName(lead) })}
      description={t('description')}
      label={fullName(lead)}
    >
      <LeadForm
        action={updateLead.bind(null, workspace.id, lead.id, lead.version)}
        defaults={leadValues(lead)}
        isEdit
        members={members.members}
        me={user.id}
        canAssign={canAssign(workspace)}
        sources={sources.sources}
        defaultCurrency={workspace.defaultCurrency}
        currencies={currencyOptions(locale)}
        timeZone={workspace.timezone}
        cancelHref={`${path}/${lead.id}`}
        submitLabel={t('submit')}
      />
    </RecordFormPage>
  );
}

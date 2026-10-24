import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createLead } from '@/actions/crm/LeadActions';
import { currencyOptions } from '@/components/crm/CreateWorkspaceForm';
import { LeadForm } from '@/components/crm/lead/LeadForm';
import { RecordFormPage } from '@/components/crm/record/RecordLayout';
import { getLeadSources, getMembers } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign } from '@/libs/crm/RecordAccess';

type NewLeadPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
};

export async function generateMetadata(props: NewLeadPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'NewLeadPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function NewLeadPage(props: NewLeadPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NewLeadPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, members, sources] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getMembers(workspaceId),
    getLeadSources(workspaceId),
  ]);
  if ([members, sources].some((result) => result.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (!workspace || !user || !members.members || !sources.sources) {
    throw new Error('Could not load the lead form');
  }
  const path = `/app/${workspace.id}/leads`;

  return (
    <RecordFormPage
      title={t('title')}
      headingId="lead-heading"
      description={t('description')}
      label={t('title')}
    >
      <LeadForm
        action={createLead.bind(null, workspace.id)}
        // A new lead is the caller's unless they give it to someone else.
        defaults={{
          firstName: '',
          lastName: '',
          companyName: '',
          email: '',
          phone: '',
          jobTitle: '',
          sourceId: null,
          ownerId: user.id,
          priority: 'MEDIUM',
          followUpDate: '',
          estimatedValue: '',
          currency: '',
          notes: '',
        }}
        members={members.members}
        me={user.id}
        canAssign={canAssign(workspace)}
        sources={sources.sources}
        defaultCurrency={workspace.defaultCurrency}
        currencies={currencyOptions(locale)}
        timeZone={workspace.timezone}
        cancelHref={path}
        submitLabel={t('submit')}
      />
    </RecordFormPage>
  );
}

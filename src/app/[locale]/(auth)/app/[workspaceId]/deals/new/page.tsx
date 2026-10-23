import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createDeal } from '@/actions/crm/DealActions';
import { currencyOptions } from '@/components/crm/CreateWorkspaceForm';
import { DealForm } from '@/components/crm/deal/DealForm';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { getDealPrefill, getLeadSources, getMembers, getStages } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { dealPreset } from '@/libs/crm/DealPreset';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign } from '@/libs/crm/RecordAccess';
import { toRecordId } from '@/libs/crm/WorkspaceId';

type NewDealPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: NewDealPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'NewDealPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function NewDealPage(props: NewDealPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NewDealPage' });
  // From a company's or contact's page (`?companyId=`, `?contactId=`), or a list's group
  // (`?stageId=`, `?ownerId=`): they come filled in.
  const links = await props.searchParams;
  const [stageId, ownerId] = [links.stageId, links.ownerId].map((value) =>
    typeof value === 'string' ? toRecordId(value) : undefined,
  );

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, members, sources, stages, linked] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getMembers(workspaceId),
    getLeadSources(workspaceId),
    getStages(workspaceId),
    getDealPrefill(workspaceId, links),
  ]);
  if ([members, sources, stages, linked].some((result) => result.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (!workspace || !user || !members.members || !sources.sources || !stages.stages) {
    throw new Error('Could not load the deal form');
  }
  const path = `/app/${workspace.id}/deals`;
  const open = stages.stages.filter((stage) => stage.kind === 'OPEN');
  const preset = dealPreset({
    stages: stages.stages,
    stageId,
    ownerId,
    members: members.members,
    mayAssign: canAssign(workspace),
    me: user.id,
  });
  const { company, contact } = linked;
  const origin = company
    ? `/app/${workspace.id}/companies/${company.id}`
    : contact && `/app/${workspace.id}/contacts/${contact.id}`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <SettingsHeader title={t('title')} description={t('description')} />
      <section
        aria-label={t('title')}
        className="max-w-3xl rounded-lg border border-rule bg-card p-5 sm:p-6"
      >
        <DealForm
          action={createDeal.bind(null, workspace.id)}
          // A new deal is the caller's unless they give it to someone else, in the first open
          // stage unless another is chosen (or the list's group named them).
          defaults={{
            name: '',
            amount: '',
            currency: '',
            stageId: preset.stageId,
            probability: '',
            expectedCloseDate: '',
            ownerId: preset.ownerId,
            companyId: company?.id ?? null,
            contactId: contact?.id ?? null,
            sourceId: null,
            notes: '',
          }}
          workspaceId={workspace.id}
          company={company}
          contact={contact}
          members={members.members}
          me={user.id}
          canAssign={canAssign(workspace)}
          sources={sources.sources}
          stages={open}
          defaultCurrency={workspace.defaultCurrency}
          currencies={currencyOptions(locale)}
          timeZone={workspace.timezone}
          cancelHref={origin ?? path}
          submitLabel={t('submit')}
        />
      </section>
    </div>
  );
}

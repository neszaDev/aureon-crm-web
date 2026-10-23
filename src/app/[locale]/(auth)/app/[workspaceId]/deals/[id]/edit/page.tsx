import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { updateDeal } from '@/actions/crm/DealActions';
import { currencyOptions } from '@/components/crm/CreateWorkspaceForm';
import { DealForm } from '@/components/crm/deal/DealForm';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { RecordFormPage } from '@/components/crm/record/RecordLayout';
import { RecordNotFound } from '@/components/crm/record/RecordNotFound';
import { getDeal, getLeadSources, getMembers, getWorkspace } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import type { components } from '@/libs/api/schema';
import { endRejectedSession } from '@/libs/api/Session';
import { recordNumber } from '@/libs/crm/Format';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign, canEditRecord } from '@/libs/crm/RecordAccess';
import type { DealValues } from '@/validations/crm/DealValidation';

type EditDealPageProps = {
  params: Promise<{ locale: string; workspaceId: string; id: string }>;
};

/**
 * The form's values of a saved deal: what the inputs hold, an absent field empty. The deal's
 * own probability is set only when it overrides its stage's.
 * @param deal The deal.
 * @returns The values.
 */
const formValues = (deal: components['schemas']['DealResponse']): DealValues => ({
  name: deal.name,
  amount: deal.amount,
  currency: deal.currency,
  stageId: null,
  probability: deal.probabilityOverride === undefined ? '' : String(deal.probabilityOverride),
  expectedCloseDate: deal.expectedCloseDate ?? '',
  ownerId: deal.owner?.userId ?? null,
  companyId: deal.company?.id ?? null,
  contactId: deal.contact?.id ?? null,
  sourceId: deal.source?.id ?? null,
  notes: deal.notes ?? '',
});

export async function generateMetadata(props: EditDealPageProps): Promise<Metadata> {
  const { locale, workspaceId, id } = await props.params;
  const t = await getTranslations({ locale, namespace: 'EditDealPage' });
  const tNotFound = await getTranslations({ locale, namespace: 'RecordNotFound' });
  // The same cached calls as the page, which shows ForbiddenNotice to a member who can't edit.
  const [{ deal, forbidden }, { user }, { workspace }] = await Promise.all([
    getDeal(workspaceId, id),
    getCurrentUser(),
    getWorkspace(workspaceId),
  ]);
  const refused =
    deal && user && workspace && !canEditRecord(workspace, user.id, deal.owner?.userId);

  return await workspacePageMetadata({
    locale,
    workspaceId,
    title: deal ? t('title', { name: deal.name }) : tNotFound('title'),
    forbidden: forbidden || refused,
  });
}

export default async function EditDealPage(props: EditDealPageProps) {
  const { locale, workspaceId, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'EditDealPage' });
  const tDeal = await getTranslations({ locale, namespace: 'DealPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, result, members, sources] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getDeal(workspaceId, id),
    getMembers(workspaceId),
    getLeadSources(workspaceId),
  ]);
  if ([result, members, sources].some((item) => item.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  const path = `/app/${workspace.id}/deals`;
  if (result.notFound) {
    return <RecordNotFound href={path} backLabel={tDeal('back')} />;
  }
  const { deal } = result;
  if (
    result.forbidden ||
    (deal && user && !canEditRecord(workspace, user.id, deal.owner?.userId))
  ) {
    return <ForbiddenNotice page />;
  }
  if (!deal || !user || !members.members || !sources.sources) {
    throw new Error('Could not load the deal');
  }

  return (
    <RecordFormPage
      number={recordNumber('deal', deal.id)}
      title={t('title', { name: deal.name })}
      description={t('description')}
      label={deal.name}
    >
      <DealForm
        action={updateDeal.bind(null, workspace.id, deal.id, deal.version)}
        defaults={formValues(deal)}
        isEdit
        workspaceId={workspace.id}
        company={deal.company ? { id: deal.company.id, label: deal.company.name } : null}
        contact={deal.contact ? { id: deal.contact.id, label: deal.contact.fullName } : null}
        members={members.members}
        me={user.id}
        canAssign={canAssign(workspace)}
        sources={sources.sources}
        stages={[]}
        stageName={deal.stage.name}
        defaultCurrency={workspace.defaultCurrency}
        currencies={currencyOptions(locale)}
        timeZone={workspace.timezone}
        cancelHref={`${path}/${deal.id}`}
        submitLabel={t('submit')}
      />
    </RecordFormPage>
  );
}

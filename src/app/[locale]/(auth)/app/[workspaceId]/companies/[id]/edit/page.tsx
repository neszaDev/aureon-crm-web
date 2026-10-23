import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { findCompanyDuplicates, updateCompany } from '@/actions/crm/CompanyActions';
import { CompanyForm } from '@/components/crm/company/CompanyForm';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { RecordFormPage } from '@/components/crm/record/RecordLayout';
import { RecordNotFound } from '@/components/crm/record/RecordNotFound';
import { getCompany, getMembers, getWorkspace } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import type { components } from '@/libs/api/schema';
import { endRejectedSession } from '@/libs/api/Session';
import { recordNumber } from '@/libs/crm/Format';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign, canEditRecord } from '@/libs/crm/RecordAccess';
import type { CompanyValues } from '@/validations/crm/CompanyValidation';

type EditCompanyPageProps = {
  params: Promise<{ locale: string; workspaceId: string; id: string }>;
};

/**
 * The form's values of a saved company: what the inputs hold, an absent field empty.
 * @param company The company.
 * @returns The values.
 */
const formValues = (company: components['schemas']['CompanyResponse']): CompanyValues => ({
  name: company.name,
  industry: company.industry ?? '',
  website: company.website ?? '',
  phone: company.phone ?? '',
  address: company.address ?? '',
  employeeCount: company.employeeCount === undefined ? '' : String(company.employeeCount),
  ownerId: company.owner?.userId ?? null,
  notes: company.notes ?? '',
});

export async function generateMetadata(props: EditCompanyPageProps): Promise<Metadata> {
  const { locale, workspaceId, id } = await props.params;
  const t = await getTranslations({ locale, namespace: 'EditCompanyPage' });
  const tNotFound = await getTranslations({ locale, namespace: 'RecordNotFound' });
  // The same cached calls as the page, which shows ForbiddenNotice to a member who can't edit.
  const [{ company, forbidden }, { user }, { workspace }] = await Promise.all([
    getCompany(workspaceId, id),
    getCurrentUser(),
    getWorkspace(workspaceId),
  ]);
  const refused =
    company && user && workspace && !canEditRecord(workspace, user.id, company.owner?.userId);

  return await workspacePageMetadata({
    locale,
    workspaceId,
    title: company ? t('title', { name: company.name }) : tNotFound('title'),
    forbidden: forbidden || refused,
  });
}

export default async function EditCompanyPage(props: EditCompanyPageProps) {
  const { locale, workspaceId, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'EditCompanyPage' });
  const tCompany = await getTranslations({ locale, namespace: 'CompanyPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, result, members] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getCompany(workspaceId, id),
    getMembers(workspaceId),
  ]);
  if (result.unauthorized || members.unauthorized) {
    return endRejectedSession(locale);
  }
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  const path = `/app/${workspace.id}/companies`;
  if (result.notFound) {
    return <RecordNotFound href={path} backLabel={tCompany('back')} />;
  }
  const { company } = result;
  if (
    result.forbidden ||
    (company && user && !canEditRecord(workspace, user.id, company.owner?.userId))
  ) {
    return <ForbiddenNotice page />;
  }
  if (!company || !user || !members.members) {
    throw new Error('Could not load the company');
  }

  return (
    <RecordFormPage
      number={recordNumber('company', company.id)}
      title={t('title', { name: company.name })}
      description={t('description')}
      label={company.name}
    >
      <CompanyForm
        action={updateCompany.bind(null, workspace.id, company.id, company.version)}
        findDuplicates={findCompanyDuplicates.bind(null, workspace.id)}
        defaults={formValues(company)}
        recordId={company.id}
        members={members.members}
        me={user.id}
        canAssign={canAssign(workspace)}
        listPath={path}
        cancelHref={`${path}/${company.id}`}
        submitLabel={t('submit')}
      />
    </RecordFormPage>
  );
}

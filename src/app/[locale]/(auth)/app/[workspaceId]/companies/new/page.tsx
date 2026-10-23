import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createCompany, findCompanyDuplicates } from '@/actions/crm/CompanyActions';
import { CompanyForm } from '@/components/crm/company/CompanyForm';
import { RecordFormPage } from '@/components/crm/record/RecordLayout';
import { getMembers } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign } from '@/libs/crm/RecordAccess';

type NewCompanyPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
};

export async function generateMetadata(props: NewCompanyPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'NewCompanyPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function NewCompanyPage(props: NewCompanyPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NewCompanyPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, members] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getMembers(workspaceId),
  ]);
  if (members.unauthorized) {
    return endRejectedSession(locale);
  }
  if (!workspace || !user || !members.members) {
    throw new Error('Could not load the workspace members');
  }
  const path = `/app/${workspace.id}/companies`;

  return (
    <RecordFormPage
      title={t('title')}
      headingId="company-heading"
      description={t('description')}
      label={t('title')}
    >
      <CompanyForm
        action={createCompany.bind(null, workspace.id)}
        findDuplicates={findCompanyDuplicates.bind(null, workspace.id)}
        // A new company is the caller's unless they give it to someone else.
        defaults={{
          name: '',
          industry: '',
          website: '',
          phone: '',
          address: '',
          employeeCount: '',
          ownerId: user.id,
          notes: '',
        }}
        members={members.members}
        me={user.id}
        canAssign={canAssign(workspace)}
        listPath={path}
        cancelHref={path}
        submitLabel={t('submit')}
      />
    </RecordFormPage>
  );
}

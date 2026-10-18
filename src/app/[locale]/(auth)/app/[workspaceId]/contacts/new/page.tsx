import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { createContact, findContactDuplicates } from '@/actions/crm/ContactActions';
import { ContactForm } from '@/components/crm/contact/ContactForm';
import { SettingsHeader } from '@/components/crm/settings/SettingsHeader';
import { getCompany, getContactTags, getLeadSources, getMembers } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign } from '@/libs/crm/RecordAccess';
import { toRecordId } from '@/libs/crm/WorkspaceId';

type NewContactPageProps = {
  params: Promise<{ locale: string; workspaceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: NewContactPageProps): Promise<Metadata> {
  const { locale, workspaceId } = await props.params;
  const t = await getTranslations({ locale, namespace: 'NewContactPage' });

  return await workspacePageMetadata({ locale, workspaceId, title: t('title') });
}

export default async function NewContactPage(props: NewContactPageProps) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'NewContactPage' });
  // From a company's page (`?companyId=`): the company comes filled in.
  const { companyId: companyParam } = await props.searchParams;
  const companyId = typeof companyParam === 'string' ? toRecordId(companyParam) : undefined;

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, members, sources, tags, linked] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getMembers(workspaceId),
    getLeadSources(workspaceId),
    getContactTags(workspaceId),
    companyId === undefined ? undefined : getCompany(workspaceId, String(companyId)),
  ]);
  if ([members, sources, tags, linked].some((result) => result?.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (!workspace || !user || !members.members || !sources.sources || !tags.tags) {
    throw new Error('Could not load the contact form');
  }
  const path = `/app/${workspace.id}/contacts`;
  // An unknown company in the link is left out rather than refused.
  const company = linked?.company ? { id: linked.company.id, label: linked.company.name } : null;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <SettingsHeader title={t('title')} description={t('description')} />
      <section
        aria-label={t('title')}
        className="max-w-3xl rounded-lg border border-rule bg-card p-5 sm:p-6"
      >
        <ContactForm
          action={createContact.bind(null, workspace.id)}
          findDuplicates={findContactDuplicates.bind(null, workspace.id)}
          // A new contact is the caller's unless they give it to someone else.
          defaults={{
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            jobTitle: '',
            companyId: company?.id ?? null,
            ownerId: user.id,
            sourceId: null,
            tags: [],
            notes: '',
          }}
          company={company}
          workspaceId={workspace.id}
          members={members.members}
          me={user.id}
          canAssign={canAssign(workspace)}
          sources={sources.sources}
          tags={tags.tags}
          listPath={path}
          cancelHref={company ? `/app/${workspace.id}/companies/${company.id}` : path}
          submitLabel={t('submit')}
        />
      </section>
    </div>
  );
}

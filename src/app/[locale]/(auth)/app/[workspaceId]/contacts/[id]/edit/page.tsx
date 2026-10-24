import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { findContactDuplicates, updateContact } from '@/actions/crm/ContactActions';
import { ContactForm } from '@/components/crm/contact/ContactForm';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { RecordFormPage } from '@/components/crm/record/RecordLayout';
import { RecordNotFound } from '@/components/crm/record/RecordNotFound';
import {
  getContact,
  getContactTags,
  getLeadSources,
  getMembers,
  getWorkspace,
} from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { recordNumber } from '@/libs/crm/Format';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign, canEditRecord } from '@/libs/crm/RecordAccess';
import { contactValues } from '@/validations/crm/ContactValidation';

type EditContactPageProps = {
  params: Promise<{ locale: string; workspaceId: string; id: string }>;
};

export async function generateMetadata(props: EditContactPageProps): Promise<Metadata> {
  const { locale, workspaceId, id } = await props.params;
  const t = await getTranslations({ locale, namespace: 'EditContactPage' });
  const tNotFound = await getTranslations({ locale, namespace: 'RecordNotFound' });
  // The same cached calls as the page, which shows ForbiddenNotice to a member who can't edit.
  const [{ contact, forbidden }, { user }, { workspace }] = await Promise.all([
    getContact(workspaceId, id),
    getCurrentUser(),
    getWorkspace(workspaceId),
  ]);
  const refused =
    contact && user && workspace && !canEditRecord(workspace, user.id, contact.owner?.userId);

  return await workspacePageMetadata({
    locale,
    workspaceId,
    title: contact ? t('title', { name: contact.fullName }) : tNotFound('title'),
    forbidden: forbidden || refused,
  });
}

export default async function EditContactPage(props: EditContactPageProps) {
  const { locale, workspaceId, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'EditContactPage' });
  const tContact = await getTranslations({ locale, namespace: 'ContactPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, result, members, sources, tags] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getContact(workspaceId, id),
    getMembers(workspaceId),
    getLeadSources(workspaceId),
    getContactTags(workspaceId),
  ]);
  if ([result, members, sources, tags].some((item) => item.unauthorized)) {
    return endRejectedSession(locale);
  }
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  const path = `/app/${workspace.id}/contacts`;
  if (result.notFound) {
    return <RecordNotFound href={path} backLabel={tContact('back')} />;
  }
  const { contact } = result;
  if (
    result.forbidden ||
    (contact && user && !canEditRecord(workspace, user.id, contact.owner?.userId))
  ) {
    return <ForbiddenNotice page />;
  }
  if (!contact || !user || !members.members || !sources.sources || !tags.tags) {
    throw new Error('Could not load the contact');
  }

  return (
    <RecordFormPage
      number={recordNumber('contact', contact.id)}
      title={t('title', { name: contact.fullName })}
      description={t('description')}
      label={contact.fullName}
    >
      <ContactForm
        action={updateContact.bind(null, workspace.id, contact.id, contact.version)}
        findDuplicates={findContactDuplicates.bind(null, workspace.id)}
        defaults={contactValues(contact)}
        company={contact.company ? { id: contact.company.id, label: contact.company.name } : null}
        recordId={contact.id}
        workspaceId={workspace.id}
        members={members.members}
        me={user.id}
        canAssign={canAssign(workspace)}
        sources={sources.sources}
        tags={tags.tags}
        listPath={path}
        cancelHref={`${path}/${contact.id}`}
        submitLabel={t('submit')}
      />
    </RecordFormPage>
  );
}

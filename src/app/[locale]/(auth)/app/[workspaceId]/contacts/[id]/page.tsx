import { PencilIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { archiveContact, restoreContact } from '@/actions/crm/ContactActions';
import { TagBadge } from '@/components/crm/contact/TagBadge';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { ArchiveButton } from '@/components/crm/record/ArchiveButton';
import { RecordFacts } from '@/components/crm/record/RecordFacts';
import { RecordHeader } from '@/components/crm/record/RecordHeader';
import { RecordNotFound } from '@/components/crm/record/RecordNotFound';
import { Button } from '@/components/ui/button';
import { getContact } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { recordNumber } from '@/libs/crm/Format';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canEditRecord } from '@/libs/crm/RecordAccess';
import { Link } from '@/libs/I18nNavigation';

type ContactPageProps = {
  params: Promise<{ locale: string; workspaceId: string; id: string }>;
};

export async function generateMetadata(props: ContactPageProps): Promise<Metadata> {
  const { locale, workspaceId, id } = await props.params;
  const t = await getTranslations({ locale, namespace: 'RecordNotFound' });
  const { contact, forbidden } = await getContact(workspaceId, id);

  return await workspacePageMetadata({
    locale,
    workspaceId,
    title: contact?.fullName ?? t('title'),
    forbidden,
  });
}

export default async function ContactPage(props: ContactPageProps) {
  const { locale, workspaceId, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ContactPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, result] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getContact(workspaceId, id),
  ]);
  if (result.unauthorized) {
    return endRejectedSession(locale);
  }
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  const path = `/app/${workspace.id}/contacts`;
  if (result.notFound) {
    return <RecordNotFound href={path} backLabel={t('back')} />;
  }
  if (result.forbidden) {
    return <ForbiddenNotice page />;
  }
  const { contact } = result;
  if (!contact || !user) {
    throw new Error('Could not load the contact');
  }

  const actions = canEditRecord(workspace, user.id, contact.owner?.userId) && (
    <>
      <Button asChild variant="outline">
        <Link href={`${path}/${contact.id}/edit`}>
          <PencilIcon data-icon="inline-start" />
          {t('edit')}
        </Link>
      </Button>
      <ArchiveButton
        id="contact-restore"
        name={contact.fullName}
        archived={contact.archived}
        archive={archiveContact.bind(null, workspace.id, contact.id)}
        restore={restoreContact.bind(null, workspace.id, contact.id)}
      />
    </>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <RecordHeader
        number={recordNumber('contact', contact.id)}
        name={contact.fullName}
        headingId="contact-heading"
        owner={contact.owner}
        archived={contact.archived}
        actions={actions}
      />
      <RecordFacts
        label={t('details')}
        facts={[
          {
            label: t('email'),
            // Encoded: a stored address can hold `?subject=…`, which must not fill in a message.
            value: contact.email && (
              <a
                href={`mailto:${encodeURIComponent(contact.email)}`}
                className="break-all text-seal-ink"
              >
                {contact.email}
              </a>
            ),
          },
          {
            label: t('phone'),
            value: contact.phone && (
              <a
                href={`tel:${contact.phone.replaceAll(/\s/gu, '')}`}
                className="text-seal-ink tabular-nums"
              >
                {contact.phone}
              </a>
            ),
          },
          { label: t('job_title'), value: contact.jobTitle },
          {
            label: t('company'),
            value: contact.company && (
              <Link
                href={`/app/${workspace.id}/companies/${contact.company.id}`}
                className="text-seal-ink"
              >
                {contact.company.name}
              </Link>
            ),
          },
          { label: t('source'), value: contact.source?.name },
          {
            label: t('tags'),
            // Undefined without tags, so the row reads "Not set".
            value:
              contact.tags.length === 0 ? undefined : (
                <ul className="flex flex-wrap gap-1.5">
                  {contact.tags.map((tag) => (
                    <li key={tag} className="max-w-full">
                      <TagBadge tag={tag} />
                    </li>
                  ))}
                </ul>
              ),
          },
          {
            label: t('notes'),
            value: contact.notes && <span className="whitespace-pre-line">{contact.notes}</span>,
          },
        ]}
      />
    </div>
  );
}

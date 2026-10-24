import {
  AlignLeftIcon,
  BriefcaseIcon,
  Building2Icon,
  MailIcon,
  MegaphoneIcon,
  PencilIcon,
  PhoneIcon,
  TagsIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { archiveContact, restoreContact } from '@/actions/crm/ContactActions';
import { RecordHistory } from '@/components/crm/audit/RecordHistory';
import { TagBadge } from '@/components/crm/contact/TagBadge';
import { RecordDeals } from '@/components/crm/deal/RecordDeals';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { ArchiveButton } from '@/components/crm/record/ArchiveButton';
import { LogActivityButton } from '@/components/crm/record/LogActivityButton';
import { RecordFacts } from '@/components/crm/record/RecordFacts';
import { RecordHeader } from '@/components/crm/record/RecordHeader';
import { RecordPage } from '@/components/crm/record/RecordLayout';
import { RecordNotFound } from '@/components/crm/record/RecordNotFound';
import { RecordWork } from '@/components/crm/record/RecordWork';
import { Button } from '@/components/ui/button';
import { getContact, getDealsOf, getStages } from '@/libs/api/CrmQueries';
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

// Its full page, and its panel over the page it was opened from (`@panel`).
export default async function ContactPage(props: ContactPageProps) {
  const { locale, workspaceId, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'ContactPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, result, deals, stages] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getContact(workspaceId, id),
    // Its first 10 active deals, most recently updated first.
    getDealsOf(workspaceId, 'contactId', id),
    // The deals' pills take their colours from the pipeline (a cached call).
    getStages(workspaceId),
  ]);
  if (result.unauthorized || deals.unauthorized || stages.unauthorized) {
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
  if (!contact || !user || !deals.deals || !stages.stages) {
    throw new Error('Could not load the contact');
  }

  const actions = (
    <>
      {canEditRecord(workspace, user.id, contact.owner?.userId) && (
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
      )}
      <LogActivityButton />
    </>
  );

  return (
    <RecordPage
      header={
        <RecordHeader
          number={recordNumber('contact', contact.id)}
          name={contact.fullName}
          headingId="contact-heading"
          owner={contact.owner}
          archived={contact.archived}
          actions={actions}
        />
      }
    >
      {/* Its tasks and activity; they show on its company's page too. */}
      <RecordWork
        workspace={workspace}
        me={user.id}
        link={{ contactId: contact.id }}
        label={contact.fullName}
        facts={
          <>
            <RecordFacts
              label={t('details')}
              facts={[
                {
                  icon: MailIcon,
                  label: t('email'),
                  // Encoded: a stored address can hold `?subject=…`, which must not fill in a
                  // message.
                  value: contact.email && (
                    <a
                      href={`mailto:${encodeURIComponent(contact.email)}`}
                      className="break-all text-violet-ink"
                    >
                      {contact.email}
                    </a>
                  ),
                },
                {
                  icon: PhoneIcon,
                  label: t('phone'),
                  value: contact.phone && (
                    <a
                      href={`tel:${contact.phone.replaceAll(/\s/gu, '')}`}
                      className="text-violet-ink tabular-nums"
                    >
                      {contact.phone}
                    </a>
                  ),
                },
                { icon: BriefcaseIcon, label: t('job_title'), value: contact.jobTitle },
                {
                  icon: Building2Icon,
                  label: t('company'),
                  value: contact.company && (
                    <Link
                      href={`/app/${workspace.id}/companies/${contact.company.id}`}
                      className="text-violet-ink"
                    >
                      {contact.company.name}
                    </Link>
                  ),
                },
                { icon: MegaphoneIcon, label: t('source'), value: contact.source?.name },
                {
                  icon: TagsIcon,
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
                  icon: AlignLeftIcon,
                  label: t('notes'),
                  value: contact.notes && (
                    <span className="whitespace-pre-line">{contact.notes}</span>
                  ),
                },
              ]}
            />
            <RecordDeals
              deals={deals.deals.content}
              total={deals.deals.totalElements}
              stages={stages.stages}
              dealsPath={`/app/${workspace.id}/deals`}
              filter={{ param: 'contactId', id: contact.id }}
              headingId="contact-deals-heading"
            />
          </>
        }
        history={<RecordHistory workspace={workspace} entityType="CONTACT" entityId={contact.id} />}
      />
    </RecordPage>
  );
}

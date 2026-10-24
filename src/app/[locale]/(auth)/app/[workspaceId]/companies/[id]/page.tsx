import {
  AlignLeftIcon,
  ExternalLinkIcon,
  FactoryIcon,
  GlobeIcon,
  MapPinIcon,
  PencilIcon,
  PhoneIcon,
  UsersIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { archiveCompany, restoreCompany } from '@/actions/crm/CompanyActions';
import { RecordHistory } from '@/components/crm/audit/RecordHistory';
import { CompanyContacts } from '@/components/crm/company/CompanyContacts';
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
import { getCompany, getCompanyLinks, getStages } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { recordNumber } from '@/libs/crm/Format';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canEditRecord } from '@/libs/crm/RecordAccess';
import { Link } from '@/libs/I18nNavigation';

type CompanyPageProps = {
  params: Promise<{ locale: string; workspaceId: string; id: string }>;
};

export async function generateMetadata(props: CompanyPageProps): Promise<Metadata> {
  const { locale, workspaceId, id } = await props.params;
  const t = await getTranslations({ locale, namespace: 'RecordNotFound' });
  const { company, forbidden } = await getCompany(workspaceId, id);

  return await workspacePageMetadata({
    locale,
    workspaceId,
    title: company?.name ?? t('title'),
    forbidden,
  });
}

// Its full page, and its panel over the page it was opened from (`@panel`).
export default async function CompanyPage(props: CompanyPageProps) {
  const { locale, workspaceId, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'CompanyPage' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, result, links, stages] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getCompany(workspaceId, id),
    // Its first 10 active contacts, by name, and its first 10 active deals.
    getCompanyLinks(workspaceId, id),
    // The deals' pills take their colours from the pipeline (a cached call).
    getStages(workspaceId),
  ]);
  if (result.unauthorized || links.unauthorized || stages.unauthorized) {
    return endRejectedSession(locale);
  }
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  const path = `/app/${workspace.id}/companies`;
  if (result.notFound) {
    return <RecordNotFound href={path} backLabel={t('back')} />;
  }
  if (result.forbidden) {
    return <ForbiddenNotice page />;
  }
  const { company } = result;
  if (!company || !user || !links.contacts || !links.deals || !stages.stages) {
    throw new Error('Could not load the company');
  }

  const actions = (
    <>
      {canEditRecord(workspace, user.id, company.owner?.userId) && (
        <>
          <Button asChild variant="outline">
            <Link href={`${path}/${company.id}/edit`}>
              <PencilIcon data-icon="inline-start" />
              {t('edit')}
            </Link>
          </Button>
          <ArchiveButton
            id="company-restore"
            name={company.name}
            archived={company.archived}
            archive={archiveCompany.bind(null, workspace.id, company.id)}
            restore={restoreCompany.bind(null, workspace.id, company.id)}
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
          number={recordNumber('company', company.id)}
          name={company.name}
          headingId="company-heading"
          owner={company.owner}
          archived={company.archived}
          actions={actions}
        />
      }
    >
      {/* Its tasks and activity (a company's: those on its contacts and deals too). */}
      <RecordWork
        workspace={workspace}
        me={user.id}
        link={{ companyId: company.id }}
        label={company.name}
        facts={
          <>
            <RecordFacts
              label={t('details')}
              facts={[
                { icon: FactoryIcon, label: t('industry'), value: company.industry },
                {
                  icon: GlobeIcon,
                  label: t('website'),
                  // The backend only takes http(s) addresses; any other scheme stays text.
                  value:
                    company.website && /^https?:\/\//iu.test(company.website) ? (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 break-all text-violet-ink"
                      >
                        {company.website}
                        <span className="sr-only"> {t('new_tab')}</span>
                        <ExternalLinkIcon aria-hidden="true" className="size-3.5 shrink-0" />
                      </a>
                    ) : (
                      company.website
                    ),
                },
                {
                  icon: PhoneIcon,
                  label: t('phone'),
                  value: company.phone && (
                    <a
                      href={`tel:${company.phone.replaceAll(/\s/gu, '')}`}
                      className="text-violet-ink tabular-nums"
                    >
                      {company.phone}
                    </a>
                  ),
                },
                {
                  icon: MapPinIcon,
                  label: t('address'),
                  value: company.address && (
                    <span className="whitespace-pre-line">{company.address}</span>
                  ),
                },
                {
                  icon: UsersIcon,
                  label: t('employees'),
                  value:
                    company.employeeCount === undefined
                      ? undefined
                      : new Intl.NumberFormat(locale).format(company.employeeCount),
                },
                {
                  icon: AlignLeftIcon,
                  label: t('notes'),
                  value: company.notes && (
                    <span className="whitespace-pre-line">{company.notes}</span>
                  ),
                },
              ]}
            />
            <CompanyContacts
              contacts={links.contacts.content}
              total={links.contacts.totalElements}
              contactsPath={`/app/${workspace.id}/contacts`}
              companyId={company.id}
            />
            <RecordDeals
              deals={links.deals.content}
              total={links.deals.totalElements}
              stages={stages.stages}
              dealsPath={`/app/${workspace.id}/deals`}
              filter={{ param: 'companyId', id: company.id }}
              headingId="company-deals-heading"
            />
          </>
        }
        history={<RecordHistory workspace={workspace} entityType="COMPANY" entityId={company.id} />}
      />
    </RecordPage>
  );
}

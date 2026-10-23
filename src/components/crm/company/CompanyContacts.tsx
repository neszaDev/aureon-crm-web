import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { RecordSection, SECTION_NOTE, SECTION_ROW } from '@/components/crm/record/RecordLayout';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import { recordNumber } from '@/libs/crm/Format';
import { Link } from '@/libs/I18nNavigation';

/**
 * A company's people on its page: how many active contacts it has, the first of them by name as
 * compact rows (name, number, job title), a link to all of them in the contacts list, and a new
 * contact already at this company.
 * @param props Component props.
 * @param props.contacts The first active contacts of the company, by name.
 * @param props.total How many active contacts it has.
 * @param props.contactsPath The contacts list; a contact's page is under it.
 * @param props.companyId The company.
 * @returns The section.
 */
export const CompanyContacts = (props: {
  contacts: components['schemas']['ContactSummary'][];
  total: number;
  contactsPath: string;
  companyId: number;
}) => {
  const t = useTranslations('CompanyContacts');

  return (
    <RecordSection
      headingId="company-contacts-heading"
      title={t('title')}
      count={t('count', { count: props.total })}
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href={`${props.contactsPath}/new?companyId=${props.companyId}`}>
            <PlusIcon data-icon="inline-start" />
            {t('new')}
          </Link>
        </Button>
      }
    >
      {props.contacts.length > 0 ? (
        <ul>
          {props.contacts.map((contact) => (
            <li key={contact.id} className={SECTION_ROW}>
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <Link
                  href={`${props.contactsPath}/${contact.id}`}
                  title={contact.fullName}
                  className="truncate text-sm font-medium text-foreground no-underline hover:underline"
                >
                  {contact.fullName}
                </Link>
                <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                  {recordNumber('contact', contact.id)}
                </span>
              </span>
              {(contact.jobTitle ?? contact.email) && (
                <span
                  title={contact.jobTitle ?? contact.email}
                  className="max-w-[45%] truncate text-[0.8125rem] text-muted-foreground"
                >
                  {contact.jobTitle ?? contact.email}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className={SECTION_NOTE}>{t('empty')}</p>
      )}
      {props.total > 0 && (
        <Link
          href={`${props.contactsPath}?companyId=${props.companyId}`}
          className="flex h-9 items-center text-[0.8125rem] font-medium text-violet-ink"
        >
          {t('view_all', { count: props.total })}
        </Link>
      )}
    </RecordSection>
  );
};

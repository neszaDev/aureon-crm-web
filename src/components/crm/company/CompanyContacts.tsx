import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import { recordNumber } from '@/libs/crm/Format';
import { Link } from '@/libs/I18nNavigation';

/**
 * A company's people on its page: how many active contacts it has, the first of them by name
 * (job title and email under each), a link to all of them in the contacts list, and a new
 * contact already at this company.
 * @param props Component props.
 * @param props.contacts The first active contacts of the company, by name.
 * @param props.total How many active contacts it has.
 * @param props.contactsPath The contacts list; a contact's page is under it.
 * @param props.companyId The company.
 * @returns The panel.
 */
export const CompanyContacts = (props: {
  contacts: components['schemas']['ContactSummary'][];
  total: number;
  contactsPath: string;
  companyId: number;
}) => {
  const t = useTranslations('CompanyContacts');

  return (
    <section
      aria-labelledby="company-contacts-heading"
      className="rounded-lg border border-rule bg-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 id="company-contacts-heading" className="flex items-baseline gap-2 font-semibold">
          {t('title')}
          <span className="text-sm font-normal text-muted-foreground tabular-nums">
            {t('count', { count: props.total })}
          </span>
        </h2>
        <Button asChild variant="outline">
          <Link href={`${props.contactsPath}/new?companyId=${props.companyId}`}>
            <PlusIcon data-icon="inline-start" />
            {t('new')}
          </Link>
        </Button>
      </div>
      {props.contacts.length > 0 ? (
        <ul>
          {props.contacts.map((contact) => {
            const detail = [contact.jobTitle, contact.email].filter(Boolean).join(' · ');

            return (
              <li key={contact.id} className="flex flex-col border-t border-rule px-5 py-3">
                <span className="flex flex-wrap items-baseline gap-x-2">
                  <Link
                    href={`${props.contactsPath}/${contact.id}`}
                    className="text-[0.9375rem] font-medium break-words text-foreground"
                  >
                    {contact.fullName}
                  </Link>
                  <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                    {recordNumber('contact', contact.id)}
                  </span>
                </span>
                {detail && (
                  <span className="text-sm break-words text-muted-foreground">{detail}</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="border-t border-rule px-5 py-4 text-muted-foreground">{t('empty')}</p>
      )}
      {props.total > 0 && (
        <p className="border-t border-rule px-5 py-3">
          <Link
            href={`${props.contactsPath}?companyId=${props.companyId}`}
            className="font-medium text-seal-ink"
          >
            {t('view_all', { count: props.total })}
          </Link>
        </p>
      )}
    </section>
  );
};

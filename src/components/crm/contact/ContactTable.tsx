import { useLocale, useTranslations } from 'next-intl';
import { SortHeader } from '@/components/crm/list/SortHeader';
import { Seal } from '@/components/crm/Seal';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { components } from '@/libs/api/schema';
import { formatInstant, recordNumber } from '@/libs/crm/Format';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { Link } from '@/libs/I18nNavigation';

// Tags shown in a row; the rest are counted.
const SHOWN_TAGS = 3;

const none = <span className="text-muted-foreground">—</span>;

/**
 * A page of contacts: name over its record number, company, email, phone, owner, the first tags
 * and when it last changed. Name, company and "Updated" sort the list.
 * @param props Component props.
 * @param props.rows The contacts.
 * @param props.path The list's path; a contact's page is under it.
 * @param props.companiesPath The companies list, for the company links.
 * @param props.query The current list query.
 * @param props.timeZone The workspace's time zone, for the dates.
 * @returns The table.
 */
export const ContactTable = (props: {
  rows: components['schemas']['ContactSummary'][];
  path: string;
  companiesPath: string;
  query: ListQuery;
  timeZone: string;
}) => {
  const t = useTranslations('ContactTable');
  const locale = useLocale();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHeader label={t('name')} sort="NAME" path={props.path} query={props.query} />
          <SortHeader
            label={t('company')}
            sort="COMPANY"
            path={props.path}
            query={props.query}
            className="max-sm:hidden"
          />
          <TableHead className="max-md:hidden">{t('email')}</TableHead>
          <TableHead className="max-lg:hidden">{t('phone')}</TableHead>
          <TableHead>{t('owner')}</TableHead>
          <TableHead className="max-lg:hidden">{t('tags')}</TableHead>
          <SortHeader
            label={t('updated')}
            sort="UPDATED_AT"
            path={props.path}
            query={props.query}
            className="max-xl:hidden"
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.map((contact) => (
          <TableRow key={contact.id}>
            <TableCell className="py-2 whitespace-normal">
              <span className="flex min-w-0 flex-col">
                <Link
                  href={`${props.path}/${contact.id}`}
                  className="text-[0.9375rem] font-medium break-words text-foreground"
                >
                  {contact.fullName}
                </Link>
                <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                  {recordNumber('contact', contact.id)}
                </span>
              </span>
            </TableCell>
            <TableCell className="whitespace-normal max-sm:hidden">
              {contact.company ? (
                <Link
                  href={`${props.companiesPath}/${contact.company.id}`}
                  className="break-words text-seal-ink"
                >
                  {contact.company.name}
                </Link>
              ) : (
                none
              )}
            </TableCell>
            <TableCell className="whitespace-normal max-md:hidden">
              {contact.email ? <span className="break-all">{contact.email}</span> : none}
            </TableCell>
            <TableCell className="tabular-nums max-lg:hidden">{contact.phone ?? none}</TableCell>
            <TableCell className="whitespace-normal">
              {contact.owner ? (
                <span className="flex items-center gap-2">
                  <Seal name={contact.owner.displayName} email={contact.owner.email} size="sm" />
                  {/* Wraps rather than truncating: touch and keyboard users can't hover a title. */}
                  <span className="max-w-40 min-w-0 break-words">
                    {contact.owner.displayName ?? contact.owner.email}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">{t('unassigned')}</span>
              )}
            </TableCell>
            <TableCell className="whitespace-normal max-lg:hidden">
              {contact.tags.length > 0 ? (
                <span className="flex max-w-56 flex-wrap items-center gap-1">
                  {contact.tags.slice(0, SHOWN_TAGS).map((tag) => (
                    // Sentence case: DESIGN.md's label rule (the primitive's uppercase is the demos').
                    <Badge
                      key={tag}
                      variant="outline"
                      className="h-auto min-h-6 max-w-full text-xs font-medium tracking-normal break-all whitespace-normal normal-case"
                    >
                      {tag}
                    </Badge>
                  ))}
                  {contact.tags.length > SHOWN_TAGS && (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      <span aria-hidden="true">
                        {t('tags_more', { count: contact.tags.length - SHOWN_TAGS })}
                      </span>
                      <span className="sr-only">
                        {t('tags_more_label', { count: contact.tags.length - SHOWN_TAGS })}
                      </span>
                    </span>
                  )}
                </span>
              ) : (
                none
              )}
            </TableCell>
            <TableCell className="text-muted-foreground tabular-nums max-xl:hidden">
              {formatInstant(contact.updatedAt, { locale, timeZone: props.timeZone })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

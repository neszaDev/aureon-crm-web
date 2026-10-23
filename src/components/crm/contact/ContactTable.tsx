import { useLocale, useTranslations } from 'next-intl';
import { archiveContact, restoreContact } from '@/actions/crm/ContactActions';
import { TagBadge } from '@/components/crm/contact/TagBadge';
import { OwnerCell } from '@/components/crm/list/OwnerCell';
import { RecordRow } from '@/components/crm/list/RecordRow';
import { RowMenu } from '@/components/crm/list/RowMenu';
import { SortHeader } from '@/components/crm/list/SortHeader';
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
import type { Permission } from '@/libs/crm/Permissions';
import { canEditRecord } from '@/libs/crm/RecordAccess';
import { Link } from '@/libs/I18nNavigation';

// Tags shown in a row, which keeps to one line; the rest are counted.
const SHOWN_TAGS = 1;

const none = <span className="text-muted-foreground">—</span>;

/**
 * Contacts as list rows: the name with its record number, company, email, phone, owner, the first
 * tags, when it last changed, and the row menu (archive, or restore) where the caller may change
 * it. Name, company and "Updated" sort the list.
 * @param props Component props.
 * @param props.rows The contacts.
 * @param props.path The list's path; a contact's page is under it.
 * @param props.companiesPath The companies list, for the company links.
 * @param props.query The current list query.
 * @param props.timeZone The workspace's time zone, for the dates.
 * @param props.workspace The workspace, with the caller's permissions.
 * @param props.workspace.id Its id.
 * @param props.workspace.permissions The caller's permissions.
 * @param props.me The caller's user id.
 * @returns The table.
 */
export const ContactTable = (props: {
  rows: components['schemas']['ContactSummary'][];
  path: string;
  companiesPath: string;
  query: ListQuery;
  timeZone: string;
  workspace: { id: number; permissions: Permission[] };
  me: number;
}) => {
  const t = useTranslations('ContactTable');
  const tList = useTranslations('ListToolbar');
  const locale = useLocale();

  return (
    // Fixed columns, so the groups of a grouped list line up.
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <SortHeader label={t('name')} sort="NAME" path={props.path} query={props.query} />
          <SortHeader
            label={t('company')}
            sort="COMPANY"
            path={props.path}
            query={props.query}
            className="w-[14%] truncate max-sm:hidden"
          />
          <TableHead className="w-[16%] truncate max-md:hidden">{t('email')}</TableHead>
          <TableHead className="w-[9%] truncate max-lg:hidden">{t('phone')}</TableHead>
          <TableHead className="w-[13%] truncate max-sm:w-32">{t('owner')}</TableHead>
          <TableHead className="w-[13%] truncate max-lg:hidden">{t('tags')}</TableHead>
          <SortHeader
            label={t('updated')}
            sort="UPDATED_AT"
            path={props.path}
            query={props.query}
            className="w-[12%] truncate max-xl:hidden"
          />
          <TableHead className="w-10">
            <span className="sr-only">{tList('actions')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.map((contact) => (
          <RecordRow
            key={contact.id}
            name={contact.fullName}
            href={`${props.path}/${contact.id}`}
            number={recordNumber('contact', contact.id)}
            menu={
              canEditRecord(props.workspace, props.me, contact.owner?.userId) && (
                <RowMenu
                  name={contact.fullName}
                  archived={contact.archived}
                  archive={archiveContact.bind(null, props.workspace.id, contact.id)}
                  restore={restoreContact.bind(null, props.workspace.id, contact.id)}
                />
              )
            }
          >
            <TableCell className="max-sm:hidden">
              {contact.company ? (
                <Link
                  href={`${props.companiesPath}/${contact.company.id}`}
                  title={contact.company.name}
                  className="block truncate text-violet-ink"
                >
                  {contact.company.name}
                </Link>
              ) : (
                none
              )}
            </TableCell>
            <TableCell className="max-md:hidden">
              {contact.email ? (
                <span title={contact.email} className="block truncate">
                  {contact.email}
                </span>
              ) : (
                none
              )}
            </TableCell>
            <TableCell title={contact.phone} className="truncate tabular-nums max-lg:hidden">
              {contact.phone ?? none}
            </TableCell>
            <OwnerCell owner={contact.owner} />
            <TableCell className="max-lg:hidden">
              {contact.tags.length > 0 ? (
                <span className="flex items-center gap-1">
                  {contact.tags.slice(0, SHOWN_TAGS).map((tag) => (
                    <TagBadge
                      key={tag}
                      tag={tag}
                      className="block min-w-0 shrink truncate leading-5 break-normal whitespace-nowrap"
                    />
                  ))}
                  {contact.tags.length > SHOWN_TAGS && (
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
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
            <TableCell className="truncate text-muted-foreground tabular-nums max-xl:hidden">
              {formatInstant(contact.updatedAt, { locale, timeZone: props.timeZone })}
            </TableCell>
          </RecordRow>
        ))}
      </TableBody>
    </Table>
  );
};

import { useLocale, useTranslations } from 'next-intl';
import { archiveCompany, restoreCompany } from '@/actions/crm/CompanyActions';
import { SelectAllHead } from '@/components/crm/list/BulkSelect';
import { OwnerCell, OwnerName } from '@/components/crm/list/OwnerCell';
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

/**
 * Companies as list rows: the box that selects one for a bulk action, the name with its record
 * number, industry, owner, contacts, open deals, when it last changed, and the row menu (archive,
 * or restore) where the caller may change it. Name and "Updated" sort the list. A phone shows the
 * name under no column heads, and under it the owner and the industry.
 * @param props Component props.
 * @param props.rows The companies.
 * @param props.path The list's path; a company's page is under it.
 * @param props.query The current list query.
 * @param props.timeZone The workspace's time zone, for the dates.
 * @param props.workspace The workspace, with the caller's permissions.
 * @param props.workspace.id Its id.
 * @param props.workspace.permissions The caller's permissions.
 * @param props.me The caller's user id.
 * @returns The table.
 */
export const CompanyTable = (props: {
  rows: components['schemas']['CompanySummary'][];
  path: string;
  query: ListQuery;
  timeZone: string;
  workspace: { id: number; permissions: Permission[] };
  me: number;
}) => {
  const t = useTranslations('CompanyTable');
  const tList = useTranslations('ListToolbar');
  const locale = useLocale();

  return (
    // Fixed columns, so the groups of a grouped list line up.
    <Table className="table-fixed">
      {/* A phone's rows say what they hold; its sort is under the toolbar. */}
      <TableHeader className="max-sm:hidden">
        <TableRow>
          <SelectAllHead />
          <SortHeader label={t('name')} sort="NAME" path={props.path} query={props.query} />
          <TableHead title={t('industry')} className="w-[16%] truncate max-md:hidden">
            {t('industry')}
          </TableHead>
          <TableHead title={t('owner')} className="w-[20%] truncate">
            {t('owner')}
          </TableHead>
          <TableHead title={t('contacts')} className="w-[10%] truncate text-right max-lg:hidden">
            {t('contacts')}
          </TableHead>
          <TableHead title={t('open_deals')} className="w-[12%] truncate text-right max-lg:hidden">
            {t('open_deals')}
          </TableHead>
          <SortHeader
            label={t('updated')}
            sort="UPDATED_AT"
            path={props.path}
            query={props.query}
            className="w-[14%] truncate max-sm:hidden"
          />
          <TableHead className="w-10">
            <span className="sr-only">{tList('actions')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.map((company) => (
          <RecordRow
            key={company.id}
            id={company.id}
            name={company.name}
            href={`${props.path}/${company.id}`}
            number={recordNumber('company', company.id)}
            detail={
              <>
                <OwnerName owner={company.owner} />
                {company.industry && (
                  <span className="min-w-0 break-words">{company.industry}</span>
                )}
              </>
            }
            menu={
              canEditRecord(props.workspace, props.me, company.owner?.userId) && (
                <RowMenu
                  name={company.name}
                  archived={company.archived}
                  archive={archiveCompany.bind(null, props.workspace.id, company.id)}
                  restore={restoreCompany.bind(null, props.workspace.id, company.id)}
                />
              )
            }
          >
            <TableCell className="max-md:hidden">
              <span title={company.industry} className="block truncate">
                {company.industry ?? <span className="text-muted-foreground">—</span>}
              </span>
            </TableCell>
            <OwnerCell owner={company.owner} className="max-sm:hidden" />
            <TableCell className="text-right tabular-nums max-lg:hidden">
              {company.contactCount}
            </TableCell>
            <TableCell className="text-right tabular-nums max-lg:hidden">
              {company.openDealCount}
            </TableCell>
            <TableCell className="truncate text-muted-foreground tabular-nums max-sm:hidden">
              {formatInstant(company.updatedAt, { locale, timeZone: props.timeZone })}
            </TableCell>
          </RecordRow>
        ))}
      </TableBody>
    </Table>
  );
};

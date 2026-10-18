import { useLocale, useTranslations } from 'next-intl';
import { SortHeader } from '@/components/crm/list/SortHeader';
import { Seal } from '@/components/crm/Seal';
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

/**
 * A page of companies: name over its record number, industry, owner, contacts, open deals and
 * when it last changed. Name and "Updated" sort the list.
 * @param props Component props.
 * @param props.rows The companies.
 * @param props.path The list's path; a company's page is under it.
 * @param props.query The current list query.
 * @param props.timeZone The workspace's time zone, for the dates.
 * @returns The table.
 */
export const CompanyTable = (props: {
  rows: components['schemas']['CompanySummary'][];
  path: string;
  query: ListQuery;
  timeZone: string;
}) => {
  const t = useTranslations('CompanyTable');
  const locale = useLocale();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHeader label={t('name')} sort="NAME" path={props.path} query={props.query} />
          <TableHead className="max-md:hidden">{t('industry')}</TableHead>
          <TableHead>{t('owner')}</TableHead>
          <TableHead className="text-right max-lg:hidden">{t('contacts')}</TableHead>
          <TableHead className="text-right max-lg:hidden">{t('open_deals')}</TableHead>
          <SortHeader
            label={t('updated')}
            sort="UPDATED_AT"
            path={props.path}
            query={props.query}
            className="max-sm:hidden"
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.map((company) => (
          <TableRow key={company.id}>
            <TableCell className="py-2 whitespace-normal">
              <span className="flex min-w-0 flex-col">
                <Link
                  href={`${props.path}/${company.id}`}
                  className="text-[0.9375rem] font-medium break-words text-foreground"
                >
                  {company.name}
                </Link>
                <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                  {recordNumber('company', company.id)}
                </span>
              </span>
            </TableCell>
            <TableCell className="whitespace-normal max-md:hidden">
              {company.industry ?? <span className="text-muted-foreground">—</span>}
            </TableCell>
            <TableCell>
              {company.owner ? (
                <span className="flex items-center gap-2">
                  <Seal name={company.owner.displayName} email={company.owner.email} size="sm" />
                  <span className="max-w-40 truncate">
                    {company.owner.displayName ?? company.owner.email}
                  </span>
                </span>
              ) : (
                <span className="text-muted-foreground">{t('unassigned')}</span>
              )}
            </TableCell>
            <TableCell className="text-right tabular-nums max-lg:hidden">
              {company.contactCount}
            </TableCell>
            <TableCell className="text-right tabular-nums max-lg:hidden">
              {company.openDealCount}
            </TableCell>
            <TableCell className="text-muted-foreground tabular-nums max-sm:hidden">
              {formatInstant(company.updatedAt, { locale, timeZone: props.timeZone })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

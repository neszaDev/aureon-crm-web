import { useLocale, useTranslations } from 'next-intl';
import { DealStatusBadge } from '@/components/crm/deal/DealStatusBadge';
import { OwnerCell } from '@/components/crm/list/OwnerCell';
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
import { formatDate, formatInstant, formatMoney, recordNumber } from '@/libs/crm/Format';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { Link } from '@/libs/I18nNavigation';

const none = <span className="text-muted-foreground">—</span>;

/**
 * A page of deals: name over its record number, company, stage, amount, expected close date,
 * owner, status and when it last changed. Name, amount, close date and "Updated" sort the list
 * (a deal row carries no creation date, so "Created" sorts from the toolbar). A phone shows name
 * and amount; wider screens add columns.
 * @param props Component props.
 * @param props.rows The deals.
 * @param props.path The deals page's path; a deal's page is under it.
 * @param props.query The current list query.
 * @param props.timeZone The workspace's time zone, for the dates of change.
 * @returns The table.
 */
export const DealTable = (props: {
  rows: components['schemas']['DealSummary'][];
  path: string;
  query: ListQuery;
  timeZone: string;
}) => {
  const t = useTranslations('DealTable');
  const locale = useLocale();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHeader label={t('name')} sort="NAME" path={props.path} query={props.query} />
          <TableHead className="max-md:hidden">{t('company')}</TableHead>
          <TableHead className="max-sm:hidden">{t('stage')}</TableHead>
          <SortHeader label={t('amount')} sort="AMOUNT" path={props.path} query={props.query} />
          <SortHeader
            label={t('close')}
            sort="EXPECTED_CLOSE_DATE"
            path={props.path}
            query={props.query}
            className="max-lg:hidden"
          />
          <TableHead className="max-lg:hidden">{t('owner')}</TableHead>
          <TableHead className="max-lg:hidden">{t('status')}</TableHead>
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
        {props.rows.map((deal) => (
          <TableRow key={deal.id}>
            <TableCell className="py-2 whitespace-normal">
              <span className="flex min-w-0 flex-col">
                <Link
                  href={`${props.path}/${deal.id}`}
                  className="text-[0.9375rem] font-medium break-words text-foreground"
                >
                  {deal.name}
                </Link>
                <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                  {recordNumber('deal', deal.id)}
                </span>
              </span>
            </TableCell>
            <TableCell className="whitespace-normal max-md:hidden">
              {deal.company ? (
                <Link
                  href={`${props.path.replace(/\/deals$/u, '')}/companies/${deal.company.id}`}
                  className="break-words text-foreground"
                >
                  {deal.company.name}
                </Link>
              ) : (
                none
              )}
            </TableCell>
            <TableCell className="whitespace-normal max-sm:hidden">{deal.stage.name}</TableCell>
            <TableCell className="font-medium tabular-nums">
              {formatMoney(deal.amount, deal.currency, locale)}
            </TableCell>
            <TableCell className="tabular-nums max-lg:hidden">
              {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate, locale) : none}
            </TableCell>
            <OwnerCell owner={deal.owner} className="max-lg:hidden" />
            <TableCell className="max-lg:hidden">
              <DealStatusBadge status={deal.status} />
            </TableCell>
            <TableCell className="text-muted-foreground tabular-nums max-xl:hidden">
              {formatInstant(deal.updatedAt, { locale, timeZone: props.timeZone })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

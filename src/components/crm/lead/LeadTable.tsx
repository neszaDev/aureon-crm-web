import { useLocale, useTranslations } from 'next-intl';
import { LeadFollowUp, isFollowUpOverdue } from '@/components/crm/lead/LeadFollowUp';
import { LeadStatusBadge } from '@/components/crm/lead/LeadStatusBadge';
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
import { formatInstant, formatMoney, fullName, recordNumber } from '@/libs/crm/Format';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { Link } from '@/libs/I18nNavigation';

const none = <span className="text-muted-foreground">—</span>;

/**
 * A page of leads: name over its record number, company name, status, priority, follow-up date
 * (an overdue one in crimson), owner, estimated value and when it was created. Name, priority,
 * follow-up and "Created" sort the list. A phone shows name and status; wider screens add columns.
 * @param props Component props.
 * @param props.rows The leads.
 * @param props.path The list's path; a lead's page is under it.
 * @param props.query The current list query.
 * @param props.timeZone The workspace's time zone, for the creation dates.
 * @param props.today Today in that time zone, `YYYY-MM-DD`: what "overdue" is measured against.
 * @returns The table.
 */
export const LeadTable = (props: {
  rows: components['schemas']['LeadResponse'][];
  path: string;
  query: ListQuery;
  timeZone: string;
  today: string;
}) => {
  const t = useTranslations('LeadTable');
  const tStatus = useTranslations('LeadStatus');
  const locale = useLocale();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortHeader label={t('name')} sort="NAME" path={props.path} query={props.query} />
          <TableHead className="max-md:hidden">{t('company')}</TableHead>
          <TableHead>{t('status')}</TableHead>
          <SortHeader
            label={t('priority')}
            sort="PRIORITY"
            path={props.path}
            query={props.query}
            className="max-md:hidden"
          />
          <SortHeader
            label={t('follow_up')}
            sort="FOLLOW_UP_DATE"
            path={props.path}
            query={props.query}
            className="max-sm:hidden"
          />
          <TableHead className="max-lg:hidden">{t('owner')}</TableHead>
          <TableHead className="max-lg:hidden">{t('value')}</TableHead>
          <SortHeader
            label={t('created')}
            sort="CREATED_AT"
            path={props.path}
            query={props.query}
            className="max-xl:hidden"
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.map((lead) => (
          <TableRow key={lead.id}>
            <TableCell className="py-2 whitespace-normal">
              <span className="flex min-w-0 flex-col">
                <Link
                  href={`${props.path}/${lead.id}`}
                  className="text-[0.9375rem] font-medium break-words text-foreground"
                >
                  {fullName(lead)}
                </Link>
                <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                  {recordNumber('lead', lead.id)}
                </span>
              </span>
            </TableCell>
            <TableCell className="whitespace-normal max-md:hidden">
              {lead.companyName ? <span className="break-words">{lead.companyName}</span> : none}
            </TableCell>
            <TableCell>
              <LeadStatusBadge status={lead.status} />
            </TableCell>
            <TableCell className="max-md:hidden">{tStatus(`priority_${lead.priority}`)}</TableCell>
            <TableCell className="whitespace-normal max-sm:hidden">
              <LeadFollowUp
                date={lead.followUpDate}
                overdue={isFollowUpOverdue(lead, props.today)}
              />
            </TableCell>
            <OwnerCell owner={lead.owner} className="max-lg:hidden" />
            <TableCell className="tabular-nums max-lg:hidden">
              {lead.estimatedValue && lead.currency
                ? formatMoney(lead.estimatedValue, lead.currency, locale)
                : none}
            </TableCell>
            <TableCell className="text-muted-foreground tabular-nums max-xl:hidden">
              {formatInstant(lead.createdAt, { locale, timeZone: props.timeZone })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

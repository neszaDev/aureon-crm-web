import { cn } from 'cn';
import { useLocale, useTranslations } from 'next-intl';
import { archiveLead, restoreLead } from '@/actions/crm/LeadActions';
import { isFollowUpOverdue, LeadFollowUp } from '@/components/crm/lead/LeadFollowUp';
import { LeadStatusPill } from '@/components/crm/lead/LeadStatusPill';
import { SelectAllHead } from '@/components/crm/list/BulkSelect';
import { OwnerCell, OwnerName } from '@/components/crm/list/OwnerCell';
import { RecordRow } from '@/components/crm/list/RecordRow';
import { RowMenu } from '@/components/crm/list/RowMenu';
import { SortHeader } from '@/components/crm/list/SortHeader';
import { PriorityFlag } from '@/components/crm/PriorityFlag';
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
import type { Permission } from '@/libs/crm/Permissions';
import { canEditRecord } from '@/libs/crm/RecordAccess';

const none = <span className="text-muted-foreground">—</span>;

/**
 * Leads as list rows: the box that selects one for a bulk action, the name with its record number, company name, the status pill (the control
 * that changes it), the priority flag, the follow-up date (an overdue one in red), owner,
 * estimated value, when it was created, and the row menu (archive, or restore) where the caller
 * may change it. Name, priority, follow-up and "Created" sort the list. A phone shows name and
 * status (in a status's section, its heading says the status: the name has the row) under no
 * column heads, and under the name the owner and the source; wider screens add columns.
 * @param props Component props.
 * @param props.rows The leads.
 * @param props.path The list's path; a lead's page is under it.
 * @param props.query The current list query.
 * @param props.timeZone The workspace's time zone, for the creation dates.
 * @param props.today Today in that time zone, `YYYY-MM-DD`: what "overdue" is measured against.
 * @param props.workspace The workspace, with the caller's permissions.
 * @param props.workspace.id Its id.
 * @param props.workspace.permissions The caller's permissions.
 * @param props.me The caller's user id.
 * @returns The table.
 */
export const LeadTable = (props: {
  rows: components['schemas']['LeadResponse'][];
  path: string;
  query: ListQuery;
  timeZone: string;
  today: string;
  workspace: { id: number; permissions: Permission[] };
  me: number;
}) => {
  const t = useTranslations('LeadTable');
  const tList = useTranslations('ListToolbar');
  const locale = useLocale();
  const byStatus = props.query.group === 'status';

  return (
    // Fixed columns, so the groups of a grouped list line up.
    <Table className="table-fixed">
      {/* A phone's rows say what they hold; its sort is under the toolbar. */}
      <TableHeader className="max-sm:hidden">
        <TableRow>
          <SelectAllHead />
          <SortHeader label={t('name')} sort="NAME" path={props.path} query={props.query} />
          <TableHead title={t('company')} className="w-[15%] truncate max-md:hidden">
            {t('company')}
          </TableHead>
          <TableHead
            title={t('status')}
            className={cn('w-36 truncate', byStatus && 'max-sm:hidden')}
          >
            {t('status')}
          </TableHead>
          <SortHeader
            label={t('priority')}
            sort="PRIORITY"
            path={props.path}
            query={props.query}
            className="w-24 truncate max-md:hidden"
          />
          <SortHeader
            label={t('follow_up')}
            sort="FOLLOW_UP_DATE"
            path={props.path}
            query={props.query}
            className="w-[12%] truncate max-lg:hidden"
          />
          <TableHead title={t('owner')} className="w-[15%] truncate max-sm:hidden">
            {t('owner')}
          </TableHead>
          <TableHead title={t('value')} className="w-[10%] truncate text-right max-2xl:hidden">
            {t('value')}
          </TableHead>
          <SortHeader
            label={t('created')}
            sort="CREATED_AT"
            path={props.path}
            query={props.query}
            className="w-[10%] truncate max-2xl:hidden"
          />
          <TableHead className="w-10">
            <span className="sr-only">{tList('actions')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.map((lead) => {
          const name = fullName(lead);
          const mayEdit = canEditRecord(props.workspace, props.me, lead.owner?.userId);
          return (
            <RecordRow
              key={lead.id}
              id={lead.id}
              name={name}
              href={`${props.path}/${lead.id}`}
              number={recordNumber('lead', lead.id)}
              detail={
                <>
                  <OwnerName owner={lead.owner} label={t('owner')} />
                  {lead.source && (
                    <span className="min-w-0 break-words">
                      <span className="sr-only">{`${t('source')} `}</span>
                      {lead.source.name}
                    </span>
                  )}
                </>
              }
              menu={
                mayEdit && (
                  <RowMenu
                    name={name}
                    archived={lead.archived}
                    archive={archiveLead.bind(null, props.workspace.id, lead.id)}
                    restore={restoreLead.bind(null, props.workspace.id, lead.id)}
                  />
                )
              }
            >
              <TableCell className="max-md:hidden">
                {lead.companyName ? (
                  <span title={lead.companyName} className="block truncate">
                    {lead.companyName}
                  </span>
                ) : (
                  none
                )}
              </TableCell>
              <TableCell
                className={cn('whitespace-normal', byStatus ? 'max-sm:hidden' : 'max-sm:w-36')}
              >
                <LeadStatusPill
                  workspaceId={props.workspace.id}
                  lead={lead}
                  name={name}
                  canEdit={mayEdit}
                />
              </TableCell>
              <TableCell className="max-md:hidden">
                <PriorityFlag priority={lead.priority} />
              </TableCell>
              <TableCell className="max-lg:hidden">
                <LeadFollowUp
                  date={lead.followUpDate}
                  overdue={isFollowUpOverdue(lead, props.today)}
                  line
                />
              </TableCell>
              <OwnerCell owner={lead.owner} className="max-sm:hidden" />
              <TableCell className="truncate text-right tabular-nums max-2xl:hidden">
                {lead.estimatedValue && lead.currency
                  ? formatMoney(lead.estimatedValue, lead.currency, locale)
                  : none}
              </TableCell>
              <TableCell className="truncate text-muted-foreground tabular-nums max-2xl:hidden">
                {formatInstant(lead.createdAt, { locale, timeZone: props.timeZone })}
              </TableCell>
            </RecordRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

import { cn } from 'cn';
import { useLocale, useTranslations } from 'next-intl';
import { archiveDeal, restoreDeal } from '@/actions/crm/DealActions';
import { DealStagePill } from '@/components/crm/deal/DealStagePill';
import { SelectAllHead } from '@/components/crm/list/BulkSelect';
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
import { formatDate, formatInstant, formatMoney, recordNumber } from '@/libs/crm/Format';
import type { ListQuery } from '@/libs/crm/ListQuery';
import type { Permission } from '@/libs/crm/Permissions';
import { canEditRecord } from '@/libs/crm/RecordAccess';
import type { StageRef } from '@/libs/crm/Stages';
import { Link } from '@/libs/I18nNavigation';

const none = <span className="text-muted-foreground">—</span>;

/**
 * Deals as list rows: the box that selects one for a bulk action, the name with its record number, company, the stage pill (the control that
 * moves it; won green, lost red), amount, expected close date, owner, when it last changed, and
 * the row menu (archive, or restore) where the caller may change it. Name, amount, close date and
 * "Updated" sort the list (a deal row carries no creation date, so "Created" sorts from the
 * toolbar). A phone shows name and stage (in a stage's section, its heading says the stage: the
 * name has the row); wider screens add columns.
 * @param props Component props.
 * @param props.rows The deals.
 * @param props.path The deals page's path; a deal's page is under it.
 * @param props.companiesPath The companies list; a company's page is under it.
 * @param props.query The current list query.
 * @param props.timeZone The workspace's time zone, for the dates of change.
 * @param props.stages The pipeline's stages, in order: the stage pill's colours and moves.
 * @param props.workspace The workspace, with the caller's permissions.
 * @param props.workspace.id Its id.
 * @param props.workspace.permissions The caller's permissions.
 * @param props.me The caller's user id.
 * @returns The table.
 */
export const DealTable = (props: {
  rows: components['schemas']['DealSummary'][];
  path: string;
  companiesPath: string;
  query: ListQuery;
  timeZone: string;
  stages: StageRef[];
  workspace: { id: number; permissions: Permission[] };
  me: number;
}) => {
  const t = useTranslations('DealTable');
  const tList = useTranslations('ListToolbar');
  const locale = useLocale();
  const byStage = props.query.group === 'stage';

  return (
    // Fixed columns, so the groups of a grouped list line up.
    <Table className="table-fixed">
      <TableHeader>
        <TableRow>
          <SelectAllHead />
          <SortHeader label={t('name')} sort="NAME" path={props.path} query={props.query} />
          <TableHead title={t('company')} className="w-[17%] truncate max-md:hidden">
            {t('company')}
          </TableHead>
          <TableHead
            title={t('stage')}
            className={cn('w-44 truncate', byStage ? 'max-sm:hidden' : 'max-sm:w-32')}
          >
            {t('stage')}
          </TableHead>
          <SortHeader
            label={t('amount')}
            sort="AMOUNT"
            path={props.path}
            query={props.query}
            className="w-32 truncate text-right max-sm:hidden"
          />
          <SortHeader
            label={t('close')}
            sort="EXPECTED_CLOSE_DATE"
            path={props.path}
            query={props.query}
            className="w-[13%] truncate max-lg:hidden"
          />
          <TableHead title={t('owner')} className="w-[13%] truncate max-lg:hidden">
            {t('owner')}
          </TableHead>
          <SortHeader
            label={t('updated')}
            sort="UPDATED_AT"
            path={props.path}
            query={props.query}
            className="w-[11%] truncate max-2xl:hidden"
          />
          <TableHead className="w-10">
            <span className="sr-only">{tList('actions')}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {props.rows.map((deal) => {
          const mayEdit = canEditRecord(props.workspace, props.me, deal.owner?.userId);
          return (
            <RecordRow
              key={deal.id}
              id={deal.id}
              name={deal.name}
              href={`${props.path}/${deal.id}`}
              number={recordNumber('deal', deal.id)}
              menu={
                mayEdit && (
                  <RowMenu
                    name={deal.name}
                    archived={deal.archived}
                    archive={archiveDeal.bind(null, props.workspace.id, deal.id)}
                    restore={restoreDeal.bind(null, props.workspace.id, deal.id)}
                  />
                )
              }
            >
              <TableCell className="max-md:hidden">
                {deal.company ? (
                  <Link
                    href={`${props.companiesPath}/${deal.company.id}`}
                    title={deal.company.name}
                    className="block truncate text-violet-ink"
                  >
                    {deal.company.name}
                  </Link>
                ) : (
                  none
                )}
              </TableCell>
              <TableCell className={cn('whitespace-normal', byStage && 'max-sm:hidden')}>
                <DealStagePill
                  workspaceId={props.workspace.id}
                  deal={deal}
                  stages={props.stages}
                  canEdit={mayEdit}
                />
              </TableCell>
              <TableCell
                // Whole in its tooltip should a long amount, or a locale's way of writing it, not fit.
                title={formatMoney(deal.amount, deal.currency, locale)}
                className="truncate text-right font-medium tabular-nums max-sm:hidden"
              >
                {formatMoney(deal.amount, deal.currency, locale)}
              </TableCell>
              <TableCell className="truncate tabular-nums max-lg:hidden">
                {deal.expectedCloseDate ? formatDate(deal.expectedCloseDate, locale) : none}
              </TableCell>
              <OwnerCell owner={deal.owner} className="max-lg:hidden" />
              <TableCell className="truncate text-muted-foreground tabular-nums max-2xl:hidden">
                {formatInstant(deal.updatedAt, { locale, timeZone: props.timeZone })}
              </TableCell>
            </RecordRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

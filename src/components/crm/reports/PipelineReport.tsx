import { useLocale, useTranslations } from 'next-intl';
import { Panel } from '@/components/crm/dashboard/Panel';
import { StageDistribution } from '@/components/crm/dashboard/StageDistribution';
import { ReportMember } from '@/components/crm/reports/ReportMember';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { components } from '@/libs/api/schema';
import { formatMoney } from '@/libs/crm/Format';

/**
 * The open deals as of now, as the API sent them: by stage (bars over their table, open under
 * its "Table" button, as the dashboard has them) and by owner, in the API's order (the largest
 * single amount first, the unassigned deals last among equals). Each currency has its own line;
 * nothing is added across currencies, owners or stages.
 * @param props Component props.
 * @param props.report The pipeline report.
 * @returns The two panels.
 */
export const PipelineReport = (props: { report: components['schemas']['PipelineReport'] }) => {
  const t = useTranslations('PipelineReport');
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);

  return (
    <div className="flex flex-col gap-5">
      <StageDistribution stages={props.report.byStage} collapsible />
      <Panel id="owners" title={t('owners_title')}>
        {props.report.byOwner.length > 0 ? (
          <Table aria-labelledby="owners-heading" className="border-t border-rule">
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="px-4 sm:px-5">
                  {t('owner')}
                </TableHead>
                <TableHead scope="col" className="text-right">
                  {t('deals')}
                </TableHead>
                <TableHead scope="col" className="px-4 text-right sm:px-5">
                  {t('value')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {props.report.byOwner.map((bucket) => (
                // One entry per owner, and one without: the owner's id tells them apart.
                <TableRow key={bucket.owner?.userId ?? 'unassigned'}>
                  <TableHead
                    scope="row"
                    className="px-4 text-sm font-medium whitespace-normal text-foreground sm:px-5"
                  >
                    <ReportMember member={bucket.owner} none={t('unassigned')} />
                  </TableHead>
                  <TableCell className="text-right tabular-nums">
                    {number.format(bucket.count)}
                  </TableCell>
                  <TableCell className="px-4 text-right whitespace-normal tabular-nums sm:px-5">
                    {bucket.totals.length > 0 ? (
                      <ul className="flex flex-col gap-0.5">
                        {bucket.totals.map((total) => (
                          <li key={total.currency}>
                            {formatMoney(total.amount, total.currency, locale)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">{t('no_value')}</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="border-t border-rule px-4 py-6 text-muted-foreground sm:px-5">
            {t('empty')}
          </p>
        )}
      </Panel>
    </div>
  );
};

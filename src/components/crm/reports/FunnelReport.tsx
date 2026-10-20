import { cn } from 'cn';
import { TriangleAlertIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Panel } from '@/components/crm/dashboard/Panel';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { components } from '@/libs/api/schema';
import { formatDate } from '@/libs/crm/Format';

/**
 * The deals created in the period and, for each stage (the open ones in order, then Won), how many
 * of them reached it or a later one, as "reached of created" with a bar under the same figure.
 * When the workspace's stage history starts after the period does (or has not started), the
 * counts of the deals created before it are low for want of records, so a caution says so, with
 * the day the history starts; a funnel is never shown as if the history were complete. The bars
 * are decoration of the table's figures and hidden from assistive technology.
 * @param props Component props.
 * @param props.report The funnel report.
 * @returns The panel.
 */
export const FunnelReport = (props: { report: components['schemas']['FunnelReport'] }) => {
  const t = useTranslations('FunnelReport');
  const locale = useLocale();
  const { created, historyFrom, period, stages } = props.report;
  // `YYYY-MM-DD` days compare as text. No history day at all: no stage change was ever recorded.
  let caution: string | undefined;
  if (historyFrom === undefined) {
    caution = t('history_none');
  } else if (historyFrom > period.from) {
    caution = t('history_from', { date: formatDate(historyFrom, locale) });
  }

  return (
    <Panel id="funnel" title={t('title')}>
      {caution && (
        <p className="mx-4 mb-3 flex items-start gap-2 rounded-md border border-rule bg-muted px-3 py-2.5 text-sm sm:mx-5">
          <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
          {caution}
        </p>
      )}
      {created > 0 ? (
        <>
          <p className="px-4 pb-3 text-sm sm:px-5">
            <span className="font-semibold">{t('created', { count: created })}</span>{' '}
            <span className="text-muted-foreground">{t('hint')}</span>
          </p>
          <Table aria-labelledby="funnel-heading" className="border-t border-rule">
            <TableHeader>
              <TableRow>
                <TableHead scope="col" className="px-4 sm:px-5">
                  {t('stage')}
                </TableHead>
                <TableHead scope="col" className="px-4 sm:px-5">
                  {t('reached')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stages.map((step) => (
                <TableRow key={step.stage.id}>
                  <TableHead
                    scope="row"
                    className="w-1/3 px-4 text-sm font-medium whitespace-normal text-foreground sm:px-5"
                  >
                    {step.stage.name}
                  </TableHead>
                  <TableCell className="px-4 sm:px-5">
                    <span className="flex items-center gap-3">
                      <span
                        data-bar
                        aria-hidden="true"
                        className="h-3 min-w-16 flex-1 rounded-sm bg-muted"
                      >
                        <span
                          className={cn(
                            'block h-full rounded-sm',
                            step.stage.kind === 'WON' ? 'bg-chart-3' : 'bg-chart-2',
                          )}
                          style={{ width: `${Math.min(100, (step.reached * 100) / created)}%` }}
                        />
                      </span>
                      <span className="w-24 shrink-0 text-right tabular-nums">
                        {t('reached_of', { reached: step.reached, created })}
                      </span>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      ) : (
        <p className="border-t border-rule px-4 py-6 text-muted-foreground sm:px-5">{t('none')}</p>
      )}
    </Panel>
  );
};

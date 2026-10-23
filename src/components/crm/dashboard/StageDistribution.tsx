'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts';
import { Panel } from '@/components/crm/dashboard/Panel';
import { ChartTable } from '@/components/crm/reports/ChartTable';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer } from '@/components/ui/chart';
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
import { stageTone } from '@/libs/crm/StatusColors';
import { usePrefersReducedMotion } from '@/utils/ReducedMotion';

const BAR_HEIGHT = 36;

/**
 * The open stages in order, each with how many deals it holds and what they are worth: bars of
 * the counts in each stage's colour (`stageTone`), each named by its stage and ending in its
 * number, so no colour has to read alone (the amber one can't), and under them the table of the
 * same figures, each stage by its colour's dot,
 * with the totals for each currency on its own line, never added. A stage without deals is
 * listed too. The bars are the table's picture: assistive technology has the table.
 * @param props Component props.
 * @param props.stages The `byStage` of the dashboard or of the pipeline report.
 * @param props.collapsible Gives the table `ChartTable`'s button to hide it (the reports'),
 *   instead of always showing it (the dashboard's).
 * @returns The panel.
 */
export const StageDistribution = (props: {
  stages: components['schemas']['StageBucket'][];
  collapsible?: boolean;
}) => {
  const t = useTranslations('StageDistribution');
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);
  const reducedMotion = usePrefersReducedMotion();
  const config = { count: { label: t('deals') } } satisfies ChartConfig;
  const toneOf = (bucket: components['schemas']['StageBucket']) =>
    stageTone(
      props.stages.map((item) => item.stage),
      bucket.stage.id,
    );

  const table = (
    <Table aria-labelledby="stages-heading">
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="px-4 sm:px-5">
            {t('stage')}
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
        {props.stages.map((bucket) => (
          <TableRow key={bucket.stage.id}>
            <TableHead
              scope="row"
              className="px-4 text-sm font-medium whitespace-normal text-foreground sm:px-5"
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  data-tone={toneOf(bucket)}
                  className="size-2 shrink-0 rounded-full bg-(--tone)"
                />
                {bucket.stage.name}
              </span>
            </TableHead>
            <TableCell className="text-right tabular-nums">{number.format(bucket.count)}</TableCell>
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
  );

  return (
    <Panel id="stages" title={t('title')}>
      {props.stages.length > 0 ? (
        <>
          <div aria-hidden="true" className="px-4 pb-3 sm:px-5">
            <ChartContainer
              config={config}
              className="aspect-auto w-full"
              style={{ height: props.stages.length * BAR_HEIGHT }}
            >
              <BarChart
                // The table is the equivalent; the chart is hidden from assistive technology, so
                // nothing in it may take the focus.
                accessibilityLayer={false}
                // A bar takes the `fill` of its entry.
                data={props.stages.map((bucket) => ({
                  name: bucket.stage.name,
                  count: bucket.count,
                  fill: `var(--status-${toneOf(bucket)})`,
                }))}
                layout="vertical"
                margin={{ top: 0, right: 28, bottom: 0, left: 0 }}
              >
                <YAxis
                  type="category"
                  dataKey="name"
                  // "Needs analysis" and a Thai stage name each on one line.
                  width={124}
                  tickLine={false}
                  axisLine={false}
                />
                <XAxis type="number" hide />
                <Bar dataKey="count" radius={3} barSize={16} isAnimationActive={!reducedMotion}>
                  <LabelList
                    dataKey="count"
                    position="right"
                    formatter={(count) => number.format(Number(count))}
                    className="fill-foreground text-xs font-medium tabular-nums"
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
          {props.collapsible ? (
            <ChartTable>{table}</ChartTable>
          ) : (
            <div className="border-t border-rule">{table}</div>
          )}
        </>
      ) : (
        <p className="border-t border-rule px-4 py-6 text-muted-foreground sm:px-5">{t('empty')}</p>
      )}
    </Panel>
  );
};

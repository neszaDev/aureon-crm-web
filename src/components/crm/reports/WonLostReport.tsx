'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useId } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
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
import { formatMoney, formatMonth } from '@/libs/crm/Format';
import { usePrefersReducedMotion } from '@/utils/ReducedMotion';

// The chart's height, set here as its width is its container's.
const CHART_HEIGHT = 256;

// The widest a bar gets, so two months do not draw slabs.
const MAX_BAR = 48;

// With more months than this the bars are too close for their numbers; the table has them.
const LABELLED_MONTHS = 6;

/**
 * The deals closed in each month of the period, as the API counted them (a month without deals
 * is there too, oldest first): grouped bars of the deals won and lost, with their counts on them
 * while there is room, and under them the table of the same figures with the won totals, each
 * currency on its own line and never added. Won is a solid green bar and Lost a hatched red one
 * (the status colours of Won and Lost), so the two read apart without their colours. When no deal
 * closed in the period, a line above says so (naming the owner it counts). The bars are the
 * table's picture: assistive technology has the table.
 * @param props Component props.
 * @param props.report The won and lost report.
 * @param props.owner The member whose records it counts, when the page counts one member's.
 * @returns The panel.
 */
export const WonLostReport = (props: {
  report: components['schemas']['WonLostReport'];
  owner?: components['schemas']['MemberRef'];
}) => {
  const t = useTranslations('WonLostReport');
  const locale = useLocale();
  const number = new Intl.NumberFormat(locale);
  const reducedMotion = usePrefersReducedMotion();
  const hatch = `lost-${useId()}`;
  const config = {
    won: { label: t('won'), color: 'var(--chart-3)' },
    lost: { label: t('lost'), color: 'var(--chart-5)' },
  } satisfies ChartConfig;
  const labelled = props.report.months.length <= LABELLED_MONTHS;
  const closed = props.report.months.some((month) => month.won + month.lost > 0);

  return (
    <Panel id="won-lost" title={t('title')}>
      {!closed && (
        <p className="px-4 pb-3 text-muted-foreground sm:px-5">
          {props.owner
            ? t('none_owner', { name: props.owner.displayName ?? props.owner.email })
            : t('none')}
        </p>
      )}
      <div aria-hidden="true" className="px-4 pb-3 sm:px-5">
        <ul className="mb-2 flex gap-4 text-[0.8125rem] font-medium">
          <li className="flex items-center gap-1.5">
            <span className="size-3 rounded-xs bg-chart-3" />
            {t('won')}
          </li>
          <li className="flex items-center gap-1.5">
            <span
              className="size-3 rounded-xs border border-chart-5"
              style={{
                background:
                  'repeating-linear-gradient(45deg, var(--chart-5) 0 1.5px, transparent 1.5px 4px)',
              }}
            />
            {t('lost')}
          </li>
        </ul>
        <ChartContainer
          config={config}
          className="aspect-auto w-full"
          style={{ height: CHART_HEIGHT }}
        >
          <BarChart
            // The table is the equivalent; the chart is hidden from assistive technology, so
            // nothing in it may take the focus.
            accessibilityLayer={false}
            data={props.report.months.map((month) => ({
              name: formatMonth(month.month, locale),
              won: month.won,
              lost: month.lost,
            }))}
            margin={{ top: 20, right: 4, bottom: 0, left: 0 }}
          >
            <defs>
              <pattern
                id={hatch}
                width={5}
                height={5}
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width={5} height={5} fill="var(--card)" />
                <rect width={2} height={5} fill="var(--color-lost)" />
              </pattern>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} minTickGap={8} />
            <YAxis allowDecimals={false} width={28} tickLine={false} axisLine={false} />
            <Bar
              dataKey="won"
              fill="var(--color-won)"
              radius={[3, 3, 0, 0]}
              maxBarSize={MAX_BAR}
              isAnimationActive={!reducedMotion}
            >
              {labelled && (
                <LabelList
                  dataKey="won"
                  position="top"
                  formatter={(count) => number.format(Number(count))}
                  className="fill-foreground text-xs font-medium tabular-nums"
                />
              )}
            </Bar>
            <Bar
              dataKey="lost"
              fill={`url(#${hatch})`}
              stroke="var(--color-lost)"
              strokeWidth={1.5}
              radius={[3, 3, 0, 0]}
              maxBarSize={MAX_BAR}
              isAnimationActive={!reducedMotion}
            >
              {labelled && (
                <LabelList
                  dataKey="lost"
                  position="top"
                  formatter={(count) => number.format(Number(count))}
                  className="fill-foreground text-xs font-medium tabular-nums"
                />
              )}
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>
      <ChartTable>
        <Table aria-labelledby="won-lost-heading">
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="px-4 sm:px-5">
                {t('month')}
              </TableHead>
              <TableHead scope="col" className="text-right">
                {t('won')}
              </TableHead>
              <TableHead scope="col" className="text-right">
                {t('lost')}
              </TableHead>
              <TableHead scope="col" className="px-4 text-right sm:px-5">
                {t('won_value')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.report.months.map((month) => (
              <TableRow key={month.month}>
                <TableHead
                  scope="row"
                  className="px-4 text-sm font-medium whitespace-normal text-foreground sm:px-5"
                >
                  {formatMonth(month.month, locale)}
                </TableHead>
                <TableCell className="text-right tabular-nums">
                  {number.format(month.won)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {number.format(month.lost)}
                </TableCell>
                <TableCell className="px-4 text-right whitespace-normal tabular-nums sm:px-5">
                  {month.wonTotals.length > 0 ? (
                    <ul className="flex flex-col gap-0.5">
                      {month.wonTotals.map((total) => (
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
      </ChartTable>
    </Panel>
  );
};

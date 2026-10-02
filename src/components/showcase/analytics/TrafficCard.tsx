'use client';

import { CloudDownloadIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, XAxis, YAxis } from 'recharts';
import { ToneProgress } from '@/components/showcase/widgets/ToneProgress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartConfig } from '@/components/ui/chart';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Period } from './data';
import {
  PERIODS,
  TRAFFIC_MAX,
  TRAFFIC_TARGET,
  TRAFFIC_TOTALS,
  trafficCsv,
  trafficSeries,
} from './data';

// The demo period ends on Sunday 27 September 2026; the month view is the four weeks before it.
const MONTH_START = Date.UTC(2026, 7, 31);
const LAST_DAY = Date.UTC(2026, 8, 27);
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The traffic card of the dashboard (`Dashboard.vue` + `MainChartExample.vue`): visits and unique
 * visitors against a target line, a day / month / year toggle, a CSV download of the shown
 * series and the totals footer.
 * @returns The card.
 */
export const TrafficCard = () => {
  const t = useTranslations('TrafficCard');
  const format = useFormatter();
  const [period, setPeriod] = useState<Period>('month');

  const periodNames: Record<Period, string> = { day: t('day'), month: t('month'), year: t('year') };
  const pointDate = (index: number) => {
    if (period === 'day') {
      return new Date(LAST_DAY + index * 60 * 60 * 1000);
    }
    if (period === 'month') {
      return new Date(MONTH_START + index * DAY_MS);
    }
    return new Date(Date.UTC(2026, index, 1));
  };
  const tickOf = (date: Date) => {
    if (period === 'day') {
      return format.dateTime(date, { hour: 'numeric', timeZone: 'UTC' });
    }
    if (period === 'month') {
      return format.dateTime(date, { weekday: 'short', timeZone: 'UTC' });
    }
    return format.dateTime(date, { month: 'short', timeZone: 'UTC' });
  };
  const titleOf = (date: Date) => {
    if (period === 'day') {
      return format.dateTime(date, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
    }
    if (period === 'month') {
      return format.dateTime(date, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        timeZone: 'UTC',
      });
    }
    return format.dateTime(date, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  };
  const subtitle = {
    day: format.dateTime(new Date(LAST_DAY), { dateStyle: 'long', timeZone: 'UTC' }),
    // Two dates in a translated template: Node and browsers disagree on the spacing ICU puts
    // around the dash in formatted ranges, which breaks hydration.
    month: t('date_range', {
      start: format.dateTime(new Date(MONTH_START), { dateStyle: 'medium', timeZone: 'UTC' }),
      end: format.dateTime(new Date(LAST_DAY), { dateStyle: 'medium', timeZone: 'UTC' }),
    }),
    year: format.dateTime(new Date(LAST_DAY), { year: 'numeric', timeZone: 'UTC' }),
  }[period];

  const rows = trafficSeries(period).map((point) => {
    const date = pointDate(point.index);
    return { ...point, tick: tickOf(date), title: titleOf(date) };
  });
  const config = {
    visits: { label: t('visits'), color: 'var(--folder)' },
    unique: { label: t('unique'), color: 'var(--ink-900)' },
  } satisfies ChartConfig;

  const download = () => {
    const csv = trafficCsv(
      [periodNames[period], t('visits'), t('unique'), t('target')],
      rows.map((row) => [row.title, row.visits, row.unique, TRAFFIC_TARGET] as const),
    );
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `traffic-${period}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const percent = (value: number) =>
    format.number(value / 100, { style: 'percent', maximumFractionDigits: 2 });
  const labels = {
    visits: t('visits'),
    unique: t('unique'),
    pageviews: t('pageviews'),
    new_users: t('new_users'),
    bounce_rate: t('bounce_rate'),
  };
  const figureOf = (total: (typeof TRAFFIC_TOTALS)[number]) => {
    const values = { count: format.number(total.count), percent: percent(total.percent) };
    if (total.id === 'bounce_rate') {
      return t('figure_rate', values);
    }
    return total.id === 'pageviews' ? t('figure_views', values) : t('figure_users', values);
  };

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="flex flex-col gap-3 border-b-[3px] border-double border-ink-300 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>
            <h2>{t('title')}</h2>
          </CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={period}
            aria-label={t('period')}
            onValueChange={(value) => {
              const next = PERIODS.find((candidate) => candidate === value);
              if (next) {
                setPeriod(next);
              }
            }}
            className="bg-ply shadow-ply"
          >
            {PERIODS.map((item) => (
              <ToggleGroupItem key={item} value={item} className="px-3 data-[state=on]:bg-ink-100">
                {periodNames[item]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <Button size="icon-sm" onClick={download} aria-label={t('download')}>
            <CloudDownloadIcon />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-4">
        <ChartContainer config={config} className="aspect-auto h-[300px] w-full">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="tick"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={12}
            />
            <YAxis
              domain={[0, TRAFFIC_MAX]}
              ticks={[0, 50, 100, 150, 200, 250]}
              tickLine={false}
              axisLine={false}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(_, payload) => {
                    const title: unknown = payload[0]?.payload?.title;
                    return typeof title === 'string' ? title : null;
                  }}
                />
              }
            />
            <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
            <ReferenceLine
              y={TRAFFIC_TARGET}
              stroke="var(--pencil)"
              strokeDasharray="8 5"
              label={{
                value: t('target'),
                position: 'insideTopRight',
                fill: 'var(--ink-600)',
                fontSize: 12,
              }}
            />
            <Area
              dataKey="visits"
              type="monotone"
              stroke="var(--color-visits)"
              strokeWidth={2}
              fill="var(--color-visits)"
              fillOpacity={0.1}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
            <Line
              dataKey="unique"
              type="monotone"
              stroke="var(--color-unique)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
      <dl className="grid gap-x-6 gap-y-4 border-t border-ink-200 bg-paper px-5 py-4 sm:grid-cols-2 lg:grid-cols-5">
        {TRAFFIC_TOTALS.map((total) => (
          <div key={total.id} className="flex flex-col gap-1">
            <dt className="form-label">{labels[total.id]}</dt>
            <dd className="flex flex-col gap-2">
              <span className="font-semibold text-ink-950 tabular-nums">{figureOf(total)}</span>
              <ToneProgress value={total.percent} label={labels[total.id]} tone={total.tone} />
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
};

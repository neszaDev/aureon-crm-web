'use client';

import { useFormatter, useTranslations } from 'next-intl';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  XAxis,
  YAxis,
} from 'recharts';
import { monthNames } from '@/components/showcase/widgets/months';
import type { ChartConfig } from '@/components/ui/chart';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { ACTIVITIES, COMMITS, FRAMEWORKS, LINE_SERIES } from './data';

// The categorical order: folder, light ink, dark ink, pale ink (checked for colour-blind separation).
const CATEGORICAL = ['var(--folder)', 'var(--ink-400)', 'var(--ink-900)', 'var(--ink-200)'];
const FRAMEWORK_IDS = ['vue', 'ember', 'react', 'angular'] as const;
const SECTOR_GAP = { stroke: 'var(--paper-card)', strokeWidth: 2 };

const frameworkConfig = Object.fromEntries(
  FRAMEWORKS.map((framework, index) => [
    FRAMEWORK_IDS[index] ?? framework.name,
    { label: framework.name, color: CATEGORICAL[index] },
  ]),
) satisfies ChartConfig;

const frameworkRows = FRAMEWORKS.map((framework, index) => ({
  id: FRAMEWORK_IDS[index] ?? framework.name,
  value: framework.value,
  fill: `var(--color-${FRAMEWORK_IDS[index] ?? framework.name})`,
}));

/**
 * Two filled lines over seven months (`CChartLineExample`).
 * @returns The chart.
 */
export const LineChartExample = () => {
  const t = useTranslations('ChartExamples');
  const months = monthNames(useFormatter(), LINE_SERIES.one.length, 'short');
  const rows = months.map((month, index) => ({
    month,
    one: LINE_SERIES.one[index],
    two: LINE_SERIES.two[index],
  }));
  const config = {
    one: { label: t('data_one'), color: 'var(--folder)' },
    two: { label: t('data_two'), color: 'var(--ink-400)' },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
        {(['one', 'two'] as const).map((key) => (
          <Area
            key={key}
            dataKey={key}
            type="monotone"
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            fill={`var(--color-${key})`}
            fillOpacity={0.12}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
};

/**
 * Commits per month as bars (`CChartBarExample`).
 * @returns The chart.
 */
export const BarChartExample = () => {
  const t = useTranslations('ChartExamples');
  const months = monthNames(useFormatter(), COMMITS.length, 'short');
  const rows = months.map((month, index) => ({ month, commits: COMMITS[index] }));
  const config = { commits: { label: t('commits'), color: 'var(--folder)' } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis tickLine={false} axisLine={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar
          dataKey="commits"
          fill="var(--color-commits)"
          radius={[4, 4, 0, 0]}
          isAnimationActive={false}
        />
      </BarChart>
    </ChartContainer>
  );
};

/**
 * Framework shares as a pie, or as a doughnut with a hole (`CChartPieExample`, `CChartDoughnutExample`).
 * @param props Component props.
 * @param props.doughnut Cuts the centre out.
 * @returns The chart.
 */
export const PieChartExample = (props: { doughnut?: boolean }) => (
  <ChartContainer config={frameworkConfig} className="aspect-square max-h-80 w-full">
    <PieChart>
      <ChartTooltip content={<ChartTooltipContent nameKey="id" hideLabel />} />
      <Pie
        data={frameworkRows}
        dataKey="value"
        nameKey="id"
        innerRadius={props.doughnut ? '55%' : 0}
        {...SECTOR_GAP}
        isAnimationActive={false}
      />
      <ChartLegend itemSorter={null} content={<ChartLegendContent nameKey="id" />} />
    </PieChart>
  </ChartContainer>
);

const useActivityRows = () => {
  const t = useTranslations('ChartExamples');
  const names = {
    eating: t('eating'),
    drinking: t('drinking'),
    sleeping: t('sleeping'),
    designing: t('designing'),
    coding: t('coding'),
    cycling: t('cycling'),
    running: t('running'),
  };
  return ACTIVITIES.map((activity) => ({ ...activity, name: names[activity.id] }));
};

const yearConfig = {
  y2019: { label: '2019', color: 'var(--ink-400)' },
  y2020: { label: '2020', color: 'var(--folder)' },
} satisfies ChartConfig;

/**
 * Two years of activity hours on a radar (`CChartRadarExample`).
 * @returns The chart.
 */
export const RadarChartExample = () => {
  const rows = useActivityRows();

  return (
    <ChartContainer config={yearConfig} className="aspect-square max-h-80 w-full">
      <RadarChart data={rows} outerRadius="70%">
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <PolarGrid />
        <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--ink-600)', fontSize: 12 }} />
        {(['y2019', 'y2020'] as const).map((key) => (
          <Radar
            key={key}
            dataKey={key}
            stroke={`var(--color-${key})`}
            strokeWidth={2}
            fill={`var(--color-${key})`}
            fillOpacity={0.2}
            dot={{ r: 3, fillOpacity: 1 }}
            isAnimationActive={false}
          />
        ))}
        <ChartLegend itemSorter={null} content={<ChartLegendContent />} />
      </RadarChart>
    </ChartContainer>
  );
};

type ActivityRow = ReturnType<typeof useActivityRows>[number];

const MAX_HOURS = Math.max(...ACTIVITIES.flatMap((activity) => [activity.y2019, activity.y2020]));

/**
 * Two years of activity hours as a polar area chart: equal angles, radius by value
 * (`CChartPolarAreaExample`).
 * @returns The chart.
 */
export const PolarAreaChartExample = () => {
  const t = useTranslations('ChartExamples');
  const format = useFormatter();
  const rows = useActivityRows().map((row) => ({ ...row, slice_y2019: 1, slice_y2020: 1 }));

  return (
    <div className="flex flex-col gap-3">
      <ChartContainer config={yearConfig} className="aspect-square max-h-80 w-full">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="name"
                hideLabel
                formatter={(_value, _name, item) => {
                  const row: ActivityRow = item.payload;
                  const key = item.dataKey === 'slice_y2020' ? 'y2020' : 'y2019';
                  return t('polar_tooltip', {
                    activity: row.name,
                    year: yearConfig[key].label,
                    hours: format.number(row[key]),
                  });
                }}
              />
            }
          />
          {(['y2019', 'y2020'] as const).map((key) => (
            <Pie
              key={key}
              data={rows}
              dataKey={`slice_${key}`}
              nameKey="name"
              outerRadius={(row: ActivityRow) => `${(row[key] / MAX_HOURS) * 100}%`}
              fill={`var(--color-${key})`}
              fillOpacity={0.35}
              stroke={`var(--color-${key})`}
              strokeWidth={1.5}
              isAnimationActive={false}
            />
          ))}
        </PieChart>
      </ChartContainer>
      <ul className="flex items-center justify-center gap-4 text-xs text-ink-700">
        {(['y2019', 'y2020'] as const).map((key) => (
          <li key={key} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-[2px]"
              style={{ backgroundColor: yearConfig[key].color }}
            />
            {yearConfig[key].label}
          </li>
        ))}
      </ul>
    </div>
  );
};

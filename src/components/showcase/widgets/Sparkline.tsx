'use client';

import { cn } from 'cn';
import { useFormatter } from 'next-intl';
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis } from 'recharts';
import type { ChartConfig } from '@/components/ui/chart';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { monthNames } from './months';

/**
 * An axis-less line or bar chart for widgets (the CoreUI `CChartLineSimple` and
 * `CChartBarSimple`), one value per month, with a hover tooltip.
 * @param props Component props.
 * @param props.kind `line` (default) or `bar`.
 * @param props.data One value per month, from January.
 * @param props.name Series name, shown in the tooltip.
 * @param props.color Stroke (line) or fill (bar) as a CSS colour, e.g. `var(--folder)`.
 * @param props.fill Area fill under the line as a CSS colour; transparent when left out.
 * @param props.fillOpacity Opacity of the area or the bars.
 * @param props.pointed Draws a dot on every value and pads the range (the "pointed" variant).
 * @param props.dotColor Fill of the dots when `pointed`.
 * @param props.linear Straight segments instead of a smooth curve.
 * @param props.strokeWidth Line width in pixels.
 * @param props.className Size classes (set a height).
 * @returns The sparkline.
 */
export const Sparkline = (props: {
  kind?: 'line' | 'bar';
  data: readonly number[];
  name: string;
  color: string;
  fill?: string;
  fillOpacity?: number;
  pointed?: boolean;
  dotColor?: string;
  linear?: boolean;
  strokeWidth?: number;
  className?: string;
}) => {
  const format = useFormatter();
  const months = monthNames(format, props.data.length);
  const rows = props.data.map((value, index) => ({ month: months[index], value }));
  const config = { value: { label: props.name, color: props.color } } satisfies ChartConfig;
  const min = Math.min(...props.data);
  const max = Math.max(...props.data);
  const tooltip = (
    <ChartTooltip
      cursor={false}
      content={<ChartTooltipContent hideIndicator className="text-ink-900" />}
    />
  );

  return (
    <ChartContainer config={config} className={cn('aspect-auto h-16 w-full', props.className)}>
      {props.kind === 'bar' ? (
        <BarChart
          data={rows}
          barCategoryGap="25%"
          margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
        >
          <XAxis dataKey="month" hide />
          <YAxis hide />
          {tooltip}
          <Bar
            dataKey="value"
            fill="var(--color-value)"
            fillOpacity={props.fillOpacity ?? 1}
            radius={[2, 2, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      ) : (
        <AreaChart data={rows} margin={{ top: 6, right: 6, bottom: 6, left: 6 }}>
          <XAxis
            dataKey="month"
            hide
            padding={props.pointed ? { left: 10, right: 10 } : undefined}
          />
          <YAxis hide domain={props.pointed ? [min - 5, max + 5] : ['dataMin', 'dataMax']} />
          {tooltip}
          <Area
            dataKey="value"
            type={props.linear ? 'linear' : 'monotone'}
            stroke="var(--color-value)"
            strokeWidth={props.strokeWidth ?? (props.pointed ? 1 : 2)}
            fill={props.fill ?? 'transparent'}
            fillOpacity={props.fillOpacity ?? 1}
            dot={
              props.pointed
                ? { r: 4, fill: props.dotColor ?? props.color, stroke: props.color, strokeWidth: 1 }
                : false
            }
            activeDot={{ r: 4, fill: props.dotColor ?? props.color, stroke: props.color }}
            isAnimationActive={false}
          />
        </AreaChart>
      )}
    </ChartContainer>
  );
};

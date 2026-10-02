'use client';

import { cn } from 'cn';
import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import type { TooltipValueType } from 'recharts';

// Themed for Marksheet: the tooltip is a white ply with an ink-200 rule and the ply shadow.
// Each theme's CSS selector prefix.
const THEMES = [
  { name: 'light', prefix: '' },
  { name: 'dark', prefix: '.dark' },
] as const;

const INITIAL_DIMENSION = { width: 320, height: 200 } as const;
type TooltipNameType = number | string;

type ThemeName = (typeof THEMES)[number]['name'];

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & ({ color?: string; theme?: never } | { color?: never; theme: Record<ThemeName, string> })
>;

type ChartContextProps = {
  config: ChartConfig;
};

type TooltipContentProps = RechartsPrimitive.DefaultTooltipContentProps<
  TooltipValueType,
  TooltipNameType
>;
type TooltipItem = NonNullable<TooltipContentProps['payload']>[number];

const ChartContext = React.createContext<ChartConfig | null>(null);

function useChart(): ChartContextProps {
  const config = React.useContext(ChartContext);

  if (!config) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }

  return { config };
}

function readStringProperty(source: object, key: string) {
  const value: unknown = key in source ? Reflect.get(source, key) : null;
  return typeof value === 'string' ? value : null;
}

function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== 'object' || payload === null) {
    return null;
  }

  const payloadPayload =
    'payload' in payload && typeof payload.payload === 'object' && payload.payload !== null
      ? payload.payload
      : undefined;

  const configLabelKey =
    readStringProperty(payload, key) ??
    (payloadPayload ? readStringProperty(payloadPayload, key) : null) ??
    key;

  return configLabelKey in config ? config[configLabelKey] : config[key];
}

function chartCss(id: string, colorConfig: [string, ChartConfig[string]][]) {
  return THEMES.map(
    (theme) => `
${theme.prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color = itemConfig.theme?.[theme.name] ?? itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join('\n')}
}
`,
  ).join('\n');
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, itemConfig]) => itemConfig.theme ?? itemConfig.color,
  );

  if (!colorConfig.length) {
    return null;
  }

  return <style>{chartCss(id, colorConfig)}</style>;
};

function ChartContainer({
  id,
  className,
  children,
  config,
  initialDimension = INITIAL_DIMENSION,
  ...props
}: React.ComponentProps<'div'> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
  initialDimension?: {
    width: number;
    height: number;
  };
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id ?? uniqueId.replaceAll(':', '')}`;

  return (
    <ChartContext value={config}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer initialDimension={initialDimension}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext>
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip;

type ChartTooltipIndicator = 'line' | 'dot' | 'dashed';

function ChartTooltipIndicatorMark(props: {
  indicator: ChartTooltipIndicator;
  nestLabel: boolean;
  color: string | undefined;
}) {
  const style: React.CSSProperties & { '--color-bg'?: string; '--color-border'?: string } = {
    '--color-bg': props.color,
    '--color-border': props.color,
  };

  return (
    <div
      className={cn('shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)', {
        'h-2.5 w-2.5': props.indicator === 'dot',
        'w-1': props.indicator === 'line',
        'w-0 border-[1.5px] border-dashed bg-transparent': props.indicator === 'dashed',
        'my-0.5': props.nestLabel && props.indicator === 'dashed',
      })}
      style={style}
    />
  );
}

type ChartTooltipItemProps = {
  item: TooltipItem;
  index: number;
  payload: readonly TooltipItem[];
  config: ChartConfig;
  indicator: ChartTooltipIndicator;
  hideIndicator: boolean;
  nestLabel: boolean;
  tooltipLabel: React.ReactNode;
  color: string | undefined;
  nameKey: string | undefined;
  formatter: TooltipContentProps['formatter'];
};

function ChartTooltipItemBody(props: ChartTooltipItemProps) {
  const { item, nestLabel } = props;
  const key = String(props.nameKey ?? item.name ?? item.dataKey ?? 'value');
  const itemConfig = getPayloadConfigFromPayload(props.config, item, key);
  const indicatorColor: string | undefined = props.color ?? item.payload?.fill ?? item.color;

  return (
    <>
      {itemConfig?.icon ? (
        <itemConfig.icon />
      ) : (
        !props.hideIndicator && (
          <ChartTooltipIndicatorMark
            indicator={props.indicator}
            nestLabel={nestLabel}
            color={indicatorColor}
          />
        )
      )}
      <div
        className={cn(
          'flex flex-1 justify-between leading-none',
          nestLabel ? 'items-end' : 'items-center',
        )}
      >
        <div className="grid gap-1.5">
          {nestLabel ? props.tooltipLabel : null}
          <span className="text-muted-foreground">{itemConfig?.label ?? item.name}</span>
        </div>
        {item.value !== null && item.value !== undefined && (
          <span className="font-mono font-medium text-foreground tabular-nums">
            {typeof item.value === 'number' ? item.value.toLocaleString() : String(item.value)}
          </span>
        )}
      </div>
    </>
  );
}

function ChartTooltipItem(props: ChartTooltipItemProps) {
  const { item } = props;

  return (
    <div
      className={cn(
        'flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground',
        props.indicator === 'dot' && 'items-center',
      )}
    >
      {props.formatter && item.value !== undefined && item.name ? (
        props.formatter(item.value, item.name, item, props.index, props.payload)
      ) : (
        <ChartTooltipItemBody {...props} />
      )}
    </div>
  );
}

// The tooltip's heading: the hovered category, through `labelFormatter` when given.
function ChartTooltipLabel({
  config,
  payload,
  label,
  labelKey,
  labelFormatter,
  labelClassName,
}: Pick<TooltipContentProps, 'label' | 'labelFormatter' | 'labelClassName'> & {
  config: ChartConfig;
  payload: NonNullable<TooltipContentProps['payload']>;
  labelKey?: string;
}) {
  const [item] = payload;
  const key = String(labelKey ?? item?.dataKey ?? item?.name ?? 'value');
  const itemConfig = getPayloadConfigFromPayload(config, item, key);
  const value =
    !labelKey && typeof label === 'string' ? (config[label]?.label ?? label) : itemConfig?.label;

  if (labelFormatter) {
    return (
      <div className={cn('font-medium', labelClassName)}>{labelFormatter(value, payload)}</div>
    );
  }

  if (!value) {
    return null;
  }

  return <div className={cn('font-medium', labelClassName)}>{value}</div>;
}

function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = 'dot',
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<'div'> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: ChartTooltipIndicator;
    nameKey?: string;
    labelKey?: string;
  } & Omit<TooltipContentProps, 'accessibilityLayer'>) {
  const { config } = useChart();

  const tooltipLabel =
    hideLabel || !payload?.length ? null : (
      <ChartTooltipLabel
        config={config}
        payload={payload}
        label={label}
        labelKey={labelKey}
        labelFormatter={labelFormatter}
        labelClassName={labelClassName}
      />
    );

  if (!active || !payload?.length) {
    return null;
  }

  const nestLabel = payload.length === 1 && indicator !== 'dot';

  return (
    <div
      className={cn(
        'grid min-w-32 items-start gap-1.5 rounded-md border border-ink-200 bg-ply px-2.5 py-1.5 text-xs text-ink-900 shadow-ply',
        className,
      )}
    >
      {nestLabel ? null : tooltipLabel}
      <div className="grid gap-1.5">
        {payload
          .filter((item) => item.type !== 'none')
          .map((item, index) => (
            <ChartTooltipItem
              key={index}
              item={item}
              index={index}
              payload={payload}
              config={config}
              indicator={indicator}
              hideIndicator={hideIndicator}
              nestLabel={nestLabel}
              tooltipLabel={tooltipLabel}
              color={color}
              nameKey={nameKey}
              formatter={formatter}
            />
          ))}
      </div>
    </div>
  );
}

const ChartLegend = RechartsPrimitive.Legend;

function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = 'bottom',
  nameKey,
}: React.ComponentProps<'div'> & {
  hideIcon?: boolean;
  nameKey?: string;
} & RechartsPrimitive.DefaultLegendContentProps) {
  const { config } = useChart();

  if (!payload?.length) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-4',
        verticalAlign === 'top' ? 'pb-3' : 'pt-3',
        className,
      )}
    >
      {payload
        .filter((item) => item.type !== 'none')
        .map((item, index) => {
          const key = String(nameKey ?? item.dataKey ?? 'value');
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={index}
              className={cn(
                'flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground',
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          );
        })}
    </div>
  );
}

export { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent };

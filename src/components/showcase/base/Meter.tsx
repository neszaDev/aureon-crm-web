'use client';

import { cn } from 'cn';
import { useFormatter } from 'next-intl';
import { Progress as ProgressPrimitive } from 'radix-ui';
import type { Tone } from './tones';
import { toneFill } from './tones';

type MeterLabel = 'value' | 'percentage';

export type MeterSegment = {
  value: number;
  tone?: Tone;
  striped?: boolean;
  animated?: boolean;
  label?: MeterLabel;
};

// Diagonal stripes: a translucent ply wash over the bar colour.
const STRIPES =
  'bg-[linear-gradient(45deg,color-mix(in_oklab,var(--ply)_22%,transparent)_25%,transparent_25%,transparent_50%,color-mix(in_oklab,var(--ply)_22%,transparent)_50%,color-mix(in_oklab,var(--ply)_22%,transparent)_75%,transparent_75%,transparent)] bg-size-[1rem_1rem]';

const KEYFRAMES =
  '@keyframes base-meter-stripes{from{background-position:1rem 0}to{background-position:0 0}}';

/**
 * A progress bar with one or more stacked segments, each a Radix `progressbar` with its own tone,
 * stripes, stripe animation and printed label (the value or the percentage of `max`, to
 * `precision` decimals). Stripes stop moving under reduced motion.
 * @param props Component props.
 * @param props.segments The bars, left to right; each segment of one meter has its own tone.
 * @param props.max The value of a full track (default 100).
 * @param props.precision Decimals in printed labels (default 0).
 * @param props.label Accessible name (of the bar, or of the group when stacked).
 * @param props.className Extra classes for the track (height, width).
 * @returns The meter.
 */
export const Meter = (props: {
  segments: MeterSegment[];
  max?: number;
  precision?: number;
  label: string;
  className?: string;
}) => {
  const format = useFormatter();
  const max = props.max ?? 100;
  const digits = {
    minimumFractionDigits: props.precision ?? 0,
    maximumFractionDigits: props.precision ?? 0,
  };
  const stacked = props.segments.length > 1;

  const text = (segment: MeterSegment) =>
    segment.label === 'percentage'
      ? format.number(segment.value / max, { style: 'percent', ...digits })
      : format.number(segment.value, digits);

  return (
    <div
      role={stacked ? 'group' : undefined}
      aria-label={stacked ? props.label : undefined}
      className={cn('flex h-4 w-full overflow-hidden rounded-sm bg-ink-100', props.className)}
    >
      {props.segments.some((segment) => segment.animated) && (
        <style href="base-meter-stripes" precedence="default">
          {KEYFRAMES}
        </style>
      )}
      {props.segments.map((segment) => (
        <ProgressPrimitive.Root
          key={segment.tone ?? 'folder'}
          value={Math.min(max, Math.max(0, segment.value))}
          max={max}
          getValueLabel={() => text({ ...segment, label: segment.label ?? 'percentage' })}
          aria-label={props.label}
          style={{ width: `${Math.min(100, Math.max(0, (segment.value / max) * 100))}%` }}
          className={cn(
            'flex items-center justify-center overflow-hidden text-[0.6875rem] leading-none font-semibold whitespace-nowrap text-ply transition-[width] duration-500 ease-out motion-reduce:transition-none',
            toneFill[segment.tone ?? 'folder'],
            segment.tone === 'light' && 'text-ink-950',
            (segment.striped === true || segment.animated === true) && STRIPES,
            segment.animated &&
              'animate-[base-meter-stripes_1s_linear_infinite] motion-reduce:animate-none',
          )}
        >
          {segment.label && text(segment)}
        </ProgressPrimitive.Root>
      ))}
    </div>
  );
};

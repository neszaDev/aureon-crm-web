'use client';

import { cn } from 'cn';
import { Switch as SwitchPrimitive } from 'radix-ui';
import type { Tone } from './tones';

export type SwitchVariant = 'default' | 'outline' | 'opposite' | '3d';

export type SwitchShape = 'default' | 'square' | 'pill';

export type SwitchSize = 'sm' | 'default' | 'lg';

// Full class names so Tailwind sees them. `track` fills the checked track, `rim` only draws
// its border, `thumb*` colour the knob.
const TONE: Record<Tone, { track: string; rim: string; thumbRim: string; thumbFill: string }> = {
  folder: {
    track: 'data-checked:border-folder data-checked:bg-folder',
    rim: 'data-checked:border-folder',
    thumbRim: 'data-checked:border-folder',
    thumbFill: 'data-checked:border-folder data-checked:bg-folder',
  },
  ink: {
    track: 'data-checked:border-ink-600 data-checked:bg-ink-600',
    rim: 'data-checked:border-ink-600',
    thumbRim: 'data-checked:border-ink-600',
    thumbFill: 'data-checked:border-ink-600 data-checked:bg-ink-600',
  },
  pass: {
    track: 'data-checked:border-pass data-checked:bg-pass',
    rim: 'data-checked:border-pass',
    thumbRim: 'data-checked:border-pass',
    thumbFill: 'data-checked:border-pass data-checked:bg-pass',
  },
  pencil: {
    track: 'data-checked:border-pencil data-checked:bg-pencil',
    rim: 'data-checked:border-pencil',
    thumbRim: 'data-checked:border-pencil',
    thumbFill: 'data-checked:border-pencil data-checked:bg-pencil',
  },
  deep: {
    track: 'data-checked:border-folder-deep data-checked:bg-folder-deep',
    rim: 'data-checked:border-folder-deep',
    thumbRim: 'data-checked:border-folder-deep',
    thumbFill: 'data-checked:border-folder-deep data-checked:bg-folder-deep',
  },
  pen: {
    track: 'data-checked:border-pen data-checked:bg-pen',
    rim: 'data-checked:border-pen',
    thumbRim: 'data-checked:border-pen',
    thumbFill: 'data-checked:border-pen data-checked:bg-pen',
  },
  light: {
    track: 'data-checked:border-ink-400 data-checked:bg-ink-200',
    rim: 'data-checked:border-ink-400',
    thumbRim: 'data-checked:border-ink-400',
    thumbFill: 'data-checked:border-ink-400 data-checked:bg-ink-300',
  },
  dark: {
    track: 'data-checked:border-ink-950 data-checked:bg-ink-950',
    rim: 'data-checked:border-ink-950',
    thumbRim: 'data-checked:border-ink-950',
    thumbFill: 'data-checked:border-ink-950 data-checked:bg-ink-950',
  },
};

// CoreUI's switch metrics: 40×26 (48 wide with a label), 48×30 large, 32×22 small; the knob
// sits 2px inside the 1px border, or covers the full height for the 3D variant.
const SIZE: Record<
  SwitchSize,
  {
    track: string;
    labelled: string;
    thumb: string;
    thumb3d: string;
    shift: string;
    labelShift: string;
    font: string;
  }
> = {
  sm: {
    track: 'h-5.5 w-8',
    labelled: 'h-5.5 w-10',
    thumb: 'size-4',
    thumb3d: 'size-5.5',
    shift: 'data-checked:translate-x-2.5',
    labelShift: 'data-checked:translate-x-4.5',
    font: 'text-[0.5rem] [&_svg]:size-2.5',
  },
  default: {
    track: 'h-6.5 w-10',
    labelled: 'h-6.5 w-12',
    thumb: 'size-5',
    thumb3d: 'size-6.5',
    shift: 'data-checked:translate-x-3.5',
    labelShift: 'data-checked:translate-x-5.5',
    font: 'text-[0.625rem] [&_svg]:size-3',
  },
  lg: {
    track: 'h-7.5 w-12',
    labelled: 'h-7.5 w-14',
    thumb: 'size-6',
    thumb3d: 'size-7.5',
    shift: 'data-checked:translate-x-4.5',
    labelShift: 'data-checked:translate-x-6.5',
    font: 'text-xs [&_svg]:size-3.5',
  },
};

const RADIUS: Record<SwitchShape, { track: string; thumb: string }> = {
  default: { track: 'rounded-md', thumb: 'rounded-sm' },
  square: { track: 'rounded-none', thumb: 'rounded-none' },
  pill: { track: 'rounded-full', thumb: 'rounded-full' },
};

// The on-label colour on a filled track, and on a white track (outline, opposite).
const ON_TEXT: Record<Tone, string> = {
  folder: 'group-data-checked/switch:text-folder-ink',
  ink: 'group-data-checked/switch:text-ply',
  pass: 'group-data-checked/switch:text-ply',
  pencil: 'group-data-checked/switch:text-ply',
  deep: 'group-data-checked/switch:text-folder-ink',
  pen: 'group-data-checked/switch:text-ply',
  light: 'group-data-checked/switch:text-ink-950',
  dark: 'group-data-checked/switch:text-ply',
};

const LINE_TEXT: Record<Tone, string> = {
  folder: 'group-data-checked/switch:text-folder',
  ink: 'group-data-checked/switch:text-ink-600',
  pass: 'group-data-checked/switch:text-pass',
  pencil: 'group-data-checked/switch:text-pencil',
  deep: 'group-data-checked/switch:text-folder-deep',
  pen: 'group-data-checked/switch:text-pen',
  light: 'group-data-checked/switch:text-ink-600',
  dark: 'group-data-checked/switch:text-ink-950',
};

/**
 * A switch in one of the showcase tones, with the CoreUI variants: filled, outline, opposite
 * (outline with a filled knob) and 3D, three shapes, three sizes and optional on/off labels.
 * Built on the Radix switch primitive, so it is a real `role="switch"` button (or a radio when
 * `asRadio` is set inside a radio group).
 * @param props Component props.
 * @param props.tone Colour when checked.
 * @param props.variant How the checked state is drawn.
 * @param props.shape Corner shape (3D switches are always pills).
 * @param props.size Track size.
 * @param props.labelOn Shown inside the track when checked.
 * @param props.labelOff Shown inside the track when unchecked.
 * @param props.checked Controlled checked state.
 * @param props.defaultChecked Initial checked state when uncontrolled.
 * @param props.onCheckedChange Called with the new state.
 * @param props.disabled Disables the switch.
 * @param props.name Form field name.
 * @param props.value Form field value.
 * @param props.asRadio Announces the switch as a radio, for a group where only one is on.
 * @param props.label Accessible name.
 * @returns The switch.
 */
export const ToneSwitch = (props: {
  tone: Tone;
  variant?: SwitchVariant;
  shape?: SwitchShape;
  size?: SwitchSize;
  labelOn?: React.ReactNode;
  labelOff?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  asRadio?: boolean;
  label: string;
}) => {
  const variant = props.variant ?? 'default';
  const is3d = variant === '3d';
  const radius = RADIUS[is3d ? 'pill' : (props.shape ?? 'default')];
  const size = SIZE[props.size ?? 'default'];
  const tone = TONE[props.tone];
  const labelled = props.labelOn !== undefined || props.labelOff !== undefined;
  const filledTrack = variant === 'default' || is3d;

  return (
    <SwitchPrimitive.Root
      checked={props.checked}
      defaultChecked={props.defaultChecked}
      onCheckedChange={props.onCheckedChange}
      disabled={props.disabled}
      name={props.name}
      value={props.value}
      role={props.asRadio ? 'radio' : 'switch'}
      aria-label={props.label}
      className={cn(
        'group/switch relative inline-flex shrink-0 border transition-[background-color,border-color] duration-150 ease-out outline-none',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'disabled:cursor-not-allowed disabled:opacity-50',
        labelled ? size.labelled : size.track,
        radius.track,
        is3d ? 'border-ink-200 bg-ink-100' : 'border-ink-300 bg-ply shadow-ply',
        filledTrack ? tone.track : tone.rim,
      )}
    >
      {labelled && (
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-y-0 flex w-1/2 items-center justify-center leading-none font-semibold uppercase',
            size.font,
            'right-px text-ink-400 group-data-checked/switch:right-auto group-data-checked/switch:left-px',
            filledTrack ? ON_TEXT[props.tone] : LINE_TEXT[props.tone],
          )}
        >
          <span className="group-data-checked/switch:hidden">{props.labelOff}</span>
          <span className="hidden group-data-checked/switch:inline">{props.labelOn}</span>
        </span>
      )}
      <SwitchPrimitive.Thumb
        className={cn(
          'pointer-events-none absolute z-10 block bg-ply transition-transform duration-150 ease-out',
          radius.thumb,
          is3d
            ? cn('-top-px -left-px shadow-sheet', size.thumb3d)
            : cn('top-0.5 left-0.5 border border-ink-200', size.thumb),
          labelled ? size.labelShift : size.shift,
          variant === 'default' && tone.thumbRim,
          variant === 'outline' && tone.thumbRim,
          variant === 'opposite' && tone.thumbFill,
        )}
      />
    </SwitchPrimitive.Root>
  );
};

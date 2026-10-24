import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';
import { initialsOf } from '@/libs/crm/Format';
import type { StatusTone } from '@/libs/crm/StatusColors';
import { PILL } from '@/libs/crm/StatusColors';

/** A member of the demo workspace: their name, and their avatar's colour (`--avatar-<n>`). */
export type SamplePerson = { name: string; colour: number };

// Draws the app's looks, not its components: `StatusPill` and `PersonAvatar` bring their menu
// and tooltip code, which this static page would load for pictures.

/**
 * A person's avatar as the app draws it: their initials on their colour.
 * @param props Component props.
 * @param props.person The person.
 * @returns The avatar.
 */
export const SampleAvatar = (props: { person: SamplePerson }) => (
  <span
    style={{ backgroundColor: `var(--avatar-${props.person.colour})` }}
    className="inline-grid size-5 shrink-0 place-items-center rounded-full text-[0.5625rem] leading-none font-semibold text-white"
  >
    {initialsOf(props.person.name, '')}
  </span>
);

/**
 * A status pill as the app draws it where it is the control: its dot, its label, its chevron.
 * @param props Component props.
 * @param props.tone The status's colour.
 * @param props.label The status.
 * @returns The pill.
 */
export const SamplePill = (props: { tone: StatusTone; label: string }) => (
  <span data-tone={props.tone} className={cn(PILL, 'pr-1.5')}>
    <span className="size-2 shrink-0 rounded-full bg-(--tone)" />
    {props.label}
    <ChevronDownIcon className="size-3.5 shrink-0" />
  </span>
);

// When a segment's fill starts (global.css `.track-fill`).
const fillDelay = (ms: number) => {
  const style: React.CSSProperties & { '--fill-delay': string } = { '--fill-delay': `${ms}ms` };
  return style;
};

/**
 * A track as the app draws it beside a record (`StatusTrack`, `LeadLifecycle`): one segment per
 * step, filled in the status's colour up to where the record is. With `fill`, each fill slides in
 * from the left after the one before it, as the record moves (none under reduced motion). The
 * days in the current step can sit beside it (its pill names the step).
 * @param props Component props.
 * @param props.tone The colour of the record's status.
 * @param props.steps How many steps the track has.
 * @param props.reached How many of them are filled.
 * @param props.fill When the first fill slides in, in ms; without it the track is drawn filled.
 * @param props.children The days in the current step, beside the track.
 * @param props.className Extra classes.
 * @returns The track.
 */
export const SampleTrack = (props: {
  tone: StatusTone;
  steps: number;
  reached: number;
  fill?: number;
  children?: React.ReactNode;
  className?: string;
}) => (
  <div data-tone={props.tone} className={cn('flex min-w-0 items-center gap-2', props.className)}>
    <span className="flex min-w-14 flex-1 gap-0.5">
      {Array.from({ length: props.steps }, (_, step) => (
        <span key={step} className="block h-1.5 flex-1 overflow-hidden rounded-full bg-rule">
          {step < props.reached && (
            <span
              style={props.fill === undefined ? undefined : fillDelay(props.fill + step * 140)}
              className={cn('block h-full bg-(--tone)', props.fill !== undefined && 'track-fill')}
            />
          )}
        </span>
      ))}
    </span>
    {props.children && (
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{props.children}</span>
    )}
  </div>
);

/**
 * A record of the demo workspace as the app's lists draw a row of it, on a panel: its name and
 * amount, its status pill, its track and its owner. A picture: hidden from assistive technology,
 * which reads its description instead.
 * @param props Component props.
 * @param props.description What it shows, in words.
 * @param props.name The record's name.
 * @param props.amount Its amount.
 * @param props.pill Its status pill.
 * @param props.track Its track.
 * @param props.owner Its owner, as the record's header says it ("Owned by Mia Rossi").
 * @param props.person Its owner, for the avatar.
 * @param props.className Extra classes.
 * @returns The sample.
 */
export const SampleRecord = (props: {
  description: string;
  name: string;
  amount: string;
  pill: React.ReactNode;
  track: React.ReactNode;
  owner: string;
  person: SamplePerson;
  className?: string;
}) => (
  <div className={props.className}>
    <p className="sr-only">{props.description}</p>
    <div
      aria-hidden="true"
      className="flex flex-wrap items-center gap-x-4 gap-y-2.5 rounded-lg border border-rule bg-card px-4 py-2.5 text-card-foreground shadow-float"
    >
      <span className="flex min-w-0 items-baseline gap-2">
        <span className="truncate text-sm font-semibold">{props.name}</span>
        <span className="shrink-0 text-[0.8125rem] text-muted-foreground tabular-nums">
          {props.amount}
        </span>
      </span>
      {props.pill}
      {props.track}
      <span className="flex shrink-0 items-center gap-2 text-[0.8125rem] text-muted-foreground">
        <SampleAvatar person={props.person} />
        <span className="max-md:sr-only">{props.owner}</span>
      </span>
    </div>
  </div>
);

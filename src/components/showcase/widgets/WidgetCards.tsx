import { cn } from 'cn';
import { Card } from '@/components/ui/card';
import { ToneProgress } from './ToneProgress';
import type { Tone } from './tones';
import { toneSolid, toneText } from './tones';

/**
 * A figure, a caption, a thin bar and a footnote (CoreUI `CWidgetProgress`).
 * @param props Component props.
 * @param props.header The figure.
 * @param props.text Caption under the figure; also names the bar.
 * @param props.footer Footnote under the bar.
 * @param props.value Bar value, 0 to 100.
 * @param props.tone Bar colour, or the card colour when `inverse`.
 * @param props.inverse Fills the card with the tone.
 * @returns The widget.
 */
export const ProgressWidget = (props: {
  header: string;
  text: string;
  footer: string;
  value: number;
  tone: Tone;
  inverse?: boolean;
}) => (
  <Card
    size="sm"
    className={cn(
      'gap-0 px-4 py-4',
      props.inverse && [toneSolid[props.tone], 'border-transparent text-folder-ink'],
    )}
  >
    <p
      className={cn(
        'text-2xl font-semibold tracking-tight tabular-nums',
        !props.inverse && 'text-ink-950',
      )}
    >
      {props.header}
    </p>
    <p className={props.inverse ? 'text-folder-ink/85' : 'text-ink-700'}>{props.text}</p>
    <ToneProgress
      value={props.value}
      label={props.text}
      tone={props.tone}
      solid={props.inverse}
      className="my-3"
    />
    <p className={cn('text-[0.8125rem]', props.inverse ? 'text-folder-ink/80' : 'text-ink-600')}>
      {props.footer}
    </p>
  </Card>
);

/**
 * A coloured icon block beside a figure and a label (CoreUI `CWidgetIcon`).
 * @param props Component props.
 * @param props.header The figure, printed in the tone.
 * @param props.text Label under the figure.
 * @param props.icon The icon (decorative).
 * @param props.tone Colour of the icon block and the figure.
 * @param props.layout `padded` (inset block), `flush` (block to the card edge) or `wide` (wider flush block).
 * @param props.footer Optional footer row, such as a "view more" link.
 * @returns The widget.
 */
export const IconWidget = (props: {
  header: string;
  text: string;
  icon: React.ReactNode;
  tone: Tone;
  layout: 'padded' | 'flush' | 'wide';
  footer?: React.ReactNode;
}) => (
  <Card size="sm" className="gap-0 py-0">
    <div className={cn('flex items-center gap-4', props.layout === 'padded' && 'p-3')}>
      <div
        aria-hidden="true"
        className={cn(
          'flex shrink-0 items-center justify-center self-stretch text-folder-ink [&_svg]:size-6',
          toneSolid[props.tone],
          props.layout === 'padded' && 'rounded-sm p-3',
          props.layout === 'flush' && 'p-5',
          props.layout === 'wide' && 'px-10 py-5',
        )}
      >
        {props.icon}
      </div>
      <div className={cn('min-w-0', props.layout !== 'padded' && 'py-3 pr-3')}>
        <p
          className={cn('text-lg font-semibold tracking-tight tabular-nums', toneText[props.tone])}
        >
          {props.header}
        </p>
        <p className="form-label">{props.text}</p>
      </div>
    </div>
    {props.footer && (
      <div className="border-t border-ink-200 bg-paper px-3 py-2">{props.footer}</div>
    )}
  </Card>
);

/**
 * An icon over a figure, a label and a thin bar (CoreUI `CWidgetProgressIcon`).
 * @param props Component props.
 * @param props.header The figure.
 * @param props.text Label under the figure; also names the bar.
 * @param props.icon The icon (decorative), shown top right.
 * @param props.tone Bar colour, or the card colour when `inverse`.
 * @param props.value Bar value, 0 to 100.
 * @param props.inverse Fills the card with the tone.
 * @param props.grouped Drops the card's own border and shadow, for a joined card group.
 * @returns The widget.
 */
export const ProgressIconWidget = (props: {
  header: string;
  text: string;
  icon: React.ReactNode;
  tone: Tone;
  value: number;
  inverse?: boolean;
  grouped?: boolean;
}) => (
  <Card
    size="sm"
    className={cn(
      'h-full gap-0 px-4 py-4',
      props.grouped && 'rounded-none border-0 shadow-none',
      props.inverse && [toneSolid[props.tone], 'border-transparent text-folder-ink'],
    )}
  >
    <div
      aria-hidden="true"
      className={cn(
        'mb-4 flex justify-end [&_svg]:size-8',
        props.inverse ? 'text-folder-ink/70' : 'text-ink-400',
      )}
    >
      {props.icon}
    </div>
    <p
      className={cn(
        'text-2xl font-semibold tracking-tight tabular-nums',
        !props.inverse && 'text-ink-950',
      )}
    >
      {props.header}
    </p>
    <p className={cn('form-label', props.inverse && 'text-folder-ink/80')}>{props.text}</p>
    <ToneProgress
      value={props.value}
      label={props.text}
      tone={props.tone}
      solid={props.inverse}
      className="mt-3"
    />
  </Card>
);

/**
 * A label, a large figure and a small chart, centred (CoreUI `CWidgetSimple`).
 * @param props Component props.
 * @param props.header Label above the figure.
 * @param props.text The figure.
 * @param props.children The chart.
 * @returns The widget.
 */
export const SimpleWidget = (props: {
  header: string;
  text: string;
  children: React.ReactNode;
}) => (
  <Card size="sm" className="items-center gap-0 px-3 py-4 text-center">
    <p className="form-label">{props.header}</p>
    <p className="py-3 text-3xl font-semibold tracking-tight text-ink-950 tabular-nums">
      {props.text}
    </p>
    {props.children}
  </Card>
);

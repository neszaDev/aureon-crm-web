import { cn } from 'cn';
import { Progress } from '@/components/ui/progress';
import type { Tone } from './tones';

// Full class names so Tailwind sees them; they colour the primitive's indicator.
const INDICATOR: Record<Tone, string> = {
  folder: '*:data-[slot=progress-indicator]:bg-folder',
  pass: '*:data-[slot=progress-indicator]:bg-pass',
  ink: '*:data-[slot=progress-indicator]:bg-ink-900',
  slate: '*:data-[slot=progress-indicator]:bg-ink-400',
  pencil: '*:data-[slot=progress-indicator]:bg-pencil',
};

/**
 * A thin progress bar in one of the widget tones, announced with its value.
 * @param props Component props.
 * @param props.value Percentage, 0 to 100.
 * @param props.label Accessible name of the bar.
 * @param props.tone Bar colour on card stock (ignored when `solid`).
 * @param props.solid Draws a folder-ink bar for a card filled with a tone.
 * @param props.className Extra classes for the track.
 * @returns The progress bar.
 */
export const ToneProgress = (props: {
  value: number;
  label: string;
  tone?: Tone;
  solid?: boolean;
  className?: string;
}) => (
  <Progress
    value={props.value}
    aria-label={props.label}
    // The primitive keeps `value` for the indicator; the root still needs it for assistive tech.
    aria-valuenow={props.value}
    className={cn(
      props.solid
        ? 'bg-folder-ink/25 *:data-[slot=progress-indicator]:bg-folder-ink'
        : ['bg-ink-100', INDICATOR[props.tone ?? 'folder']],
      props.className,
    )}
  />
);

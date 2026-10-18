import { cn } from 'cn';

/**
 * One 36 px box of a stamp row: signed with a member's seal (tilted, as pressed), the open
 * stage outlined in ink with its exact days, filled once reached, filled with the seal colour
 * when a deal is won, drawn in solid ink when it is lost, or still blank.
 * @param props Component props.
 * @param props.seal The signing member's initials.
 * @param props.days The open stage's time in it, formatted ("8d").
 * @param props.open The current stage, outlined in ink, when its days aren't known (a lead's
 *   status); `days` outlines it too.
 * @param props.filled A reached stage nobody signed: the signed fill, without a seal.
 * @param props.won The WON stage, reached: filled solid with the seal colour, its impression
 *   (the seal, when signed) drawn in `on-seal`.
 * @param props.lost The LOST stage, reached: solid ink, never the seal colour; whatever it holds
 *   (the word "Lost") is drawn in the page colour.
 * @param props.title What hovering the box says, such as who signed it.
 * @param props.press Plays the stamp-press (220 ms, none under reduced motion): the box that
 *   just became current.
 * @param props.children Extra content, such as a screen-reader label: the initials and days are
 *   hidden from assistive technology, so the label speaks for the box.
 * @returns The box.
 */
export const StampBox = (props: {
  seal?: string;
  days?: string;
  open?: boolean;
  filled?: boolean;
  won?: boolean;
  lost?: boolean;
  press?: boolean;
  title?: string;
  children?: React.ReactNode;
}) => {
  let look = 'border border-seal-ink/40 bg-field text-seal-ink';
  if (props.won) {
    look = 'border border-seal bg-seal text-on-seal';
  } else if (props.lost) {
    look = 'border border-foreground bg-foreground text-background';
  } else if (props.days || props.open) {
    look = cn('border-2 border-foreground text-seal-ink', props.seal ? 'bg-seal-tint' : 'bg-field');
  } else if (props.seal || props.filled) {
    look = 'border border-seal-ink/40 bg-seal-tint text-seal-ink';
  }

  return (
    <span
      title={props.title}
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-[3px]',
        look,
        props.press && 'stamp-press',
      )}
    >
      {props.seal && (
        <span
          aria-hidden="true"
          className={cn(
            'grid size-7 -rotate-8 place-items-center rounded-full border-[1.5px] text-[0.6875rem] leading-none font-bold',
            props.won ? 'border-on-seal' : 'border-seal-ink',
          )}
        >
          {props.seal}
        </span>
      )}
      {props.days && (
        <span
          aria-hidden="true"
          className="font-mono text-[0.6875rem] leading-none font-bold tracking-tighter tabular-nums"
        >
          {props.days}
        </span>
      )}
      {props.children}
    </span>
  );
};

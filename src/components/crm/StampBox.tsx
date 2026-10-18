import { cn } from 'cn';

/**
 * One 36 px box of a stamp row: signed with a member's seal (tilted, as pressed), the open
 * stage outlined in ink with its exact days, or still blank.
 * @param props Component props.
 * @param props.seal The signing member's initials.
 * @param props.days The open stage's time in it, formatted ("8d").
 * @param props.children Extra content, such as a screen-reader label: the initials and days are
 *   hidden from assistive technology, so the label speaks for the box.
 * @returns The box.
 */
export const StampBox = (props: { seal?: string; days?: string; children?: React.ReactNode }) => (
  <span
    className={cn(
      'grid size-9 shrink-0 place-items-center rounded-[3px] text-seal-ink',
      props.seal ? 'bg-seal-tint' : 'bg-field',
      props.days ? 'border-2 border-foreground' : 'border border-seal-ink/40',
    )}
  >
    {props.seal && (
      <span
        aria-hidden="true"
        className="grid size-7 -rotate-8 place-items-center rounded-full border-[1.5px] border-seal-ink text-[0.6875rem] leading-none font-bold"
      >
        {props.seal}
      </span>
    )}
    {props.days && (
      <span
        aria-hidden="true"
        className="font-mono text-[0.6875rem] leading-none font-bold tabular-nums"
      >
        {props.days}
      </span>
    )}
    {props.children}
  </span>
);

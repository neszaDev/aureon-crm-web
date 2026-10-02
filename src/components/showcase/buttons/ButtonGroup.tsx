import { cn } from 'cn';

/**
 * Buttons joined into one control: inner corners squared, shared borders overlapped.
 * Children must be the buttons themselves (a dropdown trigger with `asChild` counts).
 * @param props Component props.
 * @param props.label Accessible name of the group.
 * @param props.orientation Row (default) or column.
 * @param props.className Extra classes.
 * @param props.children The buttons.
 * @returns The group.
 */
export const ButtonGroup = (props: {
  label: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
  children: React.ReactNode;
}) => (
  <fieldset
    aria-label={props.label}
    data-orientation={props.orientation ?? 'horizontal'}
    className={cn(
      'flex w-fit min-w-0 *:relative *:focus-visible:z-10',
      props.orientation === 'vertical'
        ? 'flex-col *:not-first:-mt-px *:not-first:rounded-t-none *:not-last:rounded-b-none'
        : 'items-stretch *:not-first:-ml-px *:not-first:rounded-l-none *:not-last:rounded-r-none',
      props.className,
    )}
  >
    {props.children}
  </fieldset>
);

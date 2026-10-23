import { cn } from 'cn';
import { useFormatter } from 'next-intl';

/**
 * The top of a list page: its title (the page's `h1`) with how many records the list holds, and
 * its main action on the right; under them, on a hairline, its view tabs when it has more than
 * one view. The location bar above already says where it is: no description. The count is drawn
 * only; the list's own heading reads it out in words.
 * @param props Component props.
 * @param props.title The list, such as "Companies".
 * @param props.count How many records match, once known.
 * @param props.action The main action, such as "+ Add company".
 * @param props.tabs The view tabs (`ViewTabs`).
 * @returns The header.
 */
export const ListHeader = (props: {
  title: string;
  count?: number;
  action?: React.ReactNode;
  tabs?: React.ReactNode;
}) => {
  const format = useFormatter();

  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-4 gap-y-2',
        props.tabs && 'border-b border-rule',
      )}
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <h1 className="text-[1.25rem] leading-7 font-semibold tracking-[-0.01em] break-words">
          {props.title}
        </h1>
        {props.count !== undefined && (
          <span aria-hidden="true" className="text-sm text-muted-foreground tabular-nums">
            {format.number(props.count)}
          </span>
        )}
      </div>
      {props.action}
      {props.tabs && <div className="basis-full">{props.tabs}</div>}
    </header>
  );
};

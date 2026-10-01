import { cn } from 'cn';

/**
 * The heading band of an app page: title, a line of context and optional actions.
 * @param props Component props.
 * @param props.title Page title (the page's only `h1`).
 * @param props.description One line under the title.
 * @param props.actions Buttons or links aligned to the right.
 * @param props.className Extra classes.
 * @returns The page header.
 */
export const PageHeader = (props: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) => (
  <header
    className={cn(
      'flex flex-col gap-4 border-b-[3px] border-double border-ink-300 pb-6 sm:flex-row sm:items-end sm:justify-between',
      props.className,
    )}
  >
    <div className="flex min-w-0 flex-col gap-2">
      <h1 className="text-[1.75rem] leading-tight font-bold tracking-[-0.02em] break-words text-ink-950 sm:text-[2rem]">
        {props.title}
      </h1>
      {props.description && (
        <p className="flex flex-col gap-0.5 text-[0.9375rem] text-ink-600">{props.description}</p>
      )}
    </div>
    {props.actions && <div className="flex shrink-0 items-center gap-2">{props.actions}</div>}
  </header>
);

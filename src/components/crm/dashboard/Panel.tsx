import { cn } from 'cn';

/**
 * A dashboard panel: a hairline paper section with its heading row (the title left, something
 * small such as a count or a picker right) over its content. The heading takes the focus when a
 * row leaves the panel (a task completed out of a list).
 * @param props Component props.
 * @param props.id The panel's name, which makes its heading's id (`<id>-heading`).
 * @param props.title The title.
 * @param props.aside What sits right of the title.
 * @param props.className Extra classes for the section.
 * @param props.children The content, under the heading.
 * @returns The panel.
 */
export const Panel = (props: {
  id: string;
  title: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) => (
  <section
    aria-labelledby={`${props.id}-heading`}
    className={cn(
      'flex min-w-0 flex-col overflow-hidden rounded-lg border border-rule bg-card',
      props.className,
    )}
  >
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5 px-4 pt-4 pb-3 sm:px-5">
      <h2 id={`${props.id}-heading`} tabIndex={-1} className="rounded-sm font-semibold">
        {props.title}
      </h2>
      {props.aside}
    </div>
    {props.children}
  </section>
);

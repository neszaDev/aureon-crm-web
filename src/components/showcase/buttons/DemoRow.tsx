import { cn } from 'cn';

/**
 * One labelled row of examples: a printed label, then the examples wrapping beside it.
 * @param props Component props.
 * @param props.label The row's label (state or size name).
 * @param props.className Extra classes for the examples.
 * @param props.children The examples.
 * @returns The row.
 */
export const DemoRow = (props: {
  label: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className="grid gap-3 border-b border-ink-200 py-4 first:pt-0 last:border-b-0 last:pb-0 lg:grid-cols-[8rem_minmax(0,1fr)] lg:items-center">
    <p className="form-label">{props.label}</p>
    <div className={cn('flex flex-wrap items-center gap-3', props.className)}>{props.children}</div>
  </div>
);

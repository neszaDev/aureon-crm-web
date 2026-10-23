'use client';

import { usePanelId } from '@/components/crm/record/RecordPanel';

/**
 * A list on a record's left column (its contacts, deals or tasks): a heading with its count and
 * an action on the right, then its compact rows under a hairline.
 * @param props Component props.
 * @param props.headingId The heading's id (`usePanelId`); it is focusable, for the focus to land on.
 * @param props.title Its name, such as "Deals".
 * @param props.count Its count, such as "3 deals".
 * @param props.action Its "New" or "Add" button.
 * @param props.children The rows, or what says there are none.
 * @returns The section.
 */
export const RecordSection = (props: {
  headingId: string;
  title: string;
  count: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const headingId = usePanelId(props.headingId);

  return (
    <section aria-labelledby={headingId} className="flex flex-col">
      <div className="flex min-h-9 flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-1">
        <h2
          id={headingId}
          tabIndex={-1}
          className="flex items-baseline gap-2 rounded-sm text-sm font-semibold"
        >
          {props.title}
          <span className="text-[0.8125rem] font-normal text-muted-foreground tabular-nums">
            {props.count}
          </span>
        </h2>
        {props.action}
      </div>
      <div className="border-t border-rule">{props.children}</div>
    </section>
  );
};

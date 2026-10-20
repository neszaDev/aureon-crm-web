import { cn } from 'cn';

/**
 * One section of the landing page's two desks: the team's story in the wide column, the
 * developer's note in the hairline margin beside it (under it below 1024 px).
 * @param props Component props.
 * @param props.id The section's anchor.
 * @param props.titleId The id of its heading.
 * @param props.note The developer's note.
 * @param props.className Extra classes.
 * @param props.children The story.
 * @returns The section.
 */
export const Row = (props: {
  id?: string;
  titleId: string;
  note: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) => (
  <section
    id={props.id}
    aria-labelledby={props.titleId}
    className={cn(
      'group/row grid scroll-mt-6 gap-8 border-t border-rule py-16 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-12 lg:py-22 xl:grid-cols-[50rem_23rem]',
      props.className,
    )}
  >
    <div className="flex min-w-0 flex-col gap-5">{props.children}</div>
    {props.note}
  </section>
);

/**
 * The developer's note beside a section, in second ink on a hairline. With a spot, it names the
 * part of the capture it is about, and hovering it rings that part.
 * @param props Component props.
 * @param props.label "For developers", said to screen readers before the note.
 * @param props.spot The part of the capture the note is about.
 * @param props.lead A first line in ink, above the note.
 * @param props.children The note.
 * @returns The note.
 */
export const Note = (props: {
  label: string;
  spot?: string;
  lead?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div
    data-spot={props.spot ? '' : undefined}
    className="flex flex-col gap-2.5 self-start border-l border-rule pl-6 text-[0.9375rem] leading-relaxed text-ink-2"
  >
    {props.lead}
    {props.spot && (
      <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-seal-ink">
        <span
          aria-hidden="true"
          className="h-3 w-4.5 shrink-0 rounded-[3px] border-2 border-seal-ink"
        />
        {props.spot}
      </p>
    )}
    <p>
      {!props.lead && <span className="sr-only">{`${props.label}: `}</span>}
      {props.children}
    </p>
  </div>
);

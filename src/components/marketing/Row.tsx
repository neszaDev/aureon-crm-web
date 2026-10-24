import { cn } from 'cn';

/**
 * One section of the landing page's two desks: the team's story in the wide column, the
 * developer's note in the hairline margin beside it (under it below 1024 px). With `wide`, a
 * capture across both, under them, as large as the page allows (on a phone, before the note).
 * @param props Component props.
 * @param props.id The section's anchor.
 * @param props.titleId The id of its heading.
 * @param props.note The developer's note.
 * @param props.wide The capture across the page.
 * @param props.className Extra classes.
 * @param props.children The story.
 * @returns The section.
 */
export const Row = (props: {
  id?: string;
  titleId: string;
  note: React.ReactNode;
  wide?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) => (
  <section
    id={props.id}
    aria-labelledby={props.titleId}
    className={cn(
      'group/row grid scroll-mt-6 gap-8 border-t border-rule py-16 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:gap-12 lg:py-22 xl:grid-cols-[50rem_minmax(0,1fr)]',
      props.className,
    )}
  >
    <div className="flex min-w-0 flex-col gap-5">{props.children}</div>
    {props.wide && <div className="min-w-0 lg:col-span-2 lg:row-start-2">{props.wide}</div>}
    <div className="flex lg:col-start-2 lg:row-start-1">{props.note}</div>
  </section>
);

/**
 * The developer's note beside a section, in second ink on a hairline. With a spot, its first words
 * name the part of the capture it is about, and hovering it rings that part.
 * @param props Component props.
 * @param props.label "For developers", said to screen readers before the note.
 * @param props.spot Whether the note is about a ringed part of the capture.
 * @param props.lead A first line in ink, above the note.
 * @param props.children The note.
 * @returns The note.
 */
export const Note = (props: {
  label: string;
  spot?: boolean;
  lead?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div
    data-spot={props.spot ? '' : undefined}
    className="flex flex-col gap-2.5 self-start border-l border-rule pl-6 text-[0.9375rem] leading-relaxed text-ink-2"
  >
    {props.lead}
    <p>
      {!props.lead && <span className="sr-only">{`${props.label}: `}</span>}
      {props.children}
    </p>
  </div>
);

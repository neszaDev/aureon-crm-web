import { useTranslations } from 'next-intl';
import { RecordFormHeader } from '@/components/crm/record/RecordHeader';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * A record's page, the same in its panel and on its full page: its header across, then its
 * columns (`RecordColumns`).
 * @param props Component props.
 * @param props.header The `RecordHeader`.
 * @param props.children The columns.
 * @returns The page.
 */
export const RecordPage = (props: { header: React.ReactNode; children: React.ReactNode }) => (
  <div data-record="" className="mx-auto flex max-w-6xl flex-col gap-6">
    {props.header}
    {props.children}
  </div>
);

/**
 * A record's form page, a new record's or an edit (in its record's frame): its number when it has
 * one, its title on a small scale (the form's large name input leads) and what the page is for
 * over a hairline, then the form, on the page's own ground. The same in the record panel (a new record opened from inside the workspace) and on its
 * full page.
 * @param props Component props.
 * @param props.number The record number, such as `C-0042`, when it is saved.
 * @param props.title The page's title, its `h1`.
 * @param props.headingId The title's id: a new record's `<kind>-heading` names the record panel.
 * @param props.description What the page is for.
 * @param props.label The form's region name: the record's name, or the page's title.
 * @param props.children The form.
 * @returns The page.
 */
export const RecordFormPage = (props: {
  number?: string;
  title: string;
  headingId?: string;
  description: string;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="mx-auto flex max-w-3xl flex-col gap-6">
    <RecordFormHeader
      number={props.number}
      title={props.title}
      headingId={props.headingId}
      description={props.description}
    />
    <section aria-label={props.label}>{props.children}</section>
  </div>
);

/**
 * A record's two columns from 1024 px (one below): what it is on the left, its properties and
 * linked records; what happened on the right, on the sidebar's ground: its activity, then its
 * history.
 * @param props Component props.
 * @param props.left Its properties and linked records.
 * @param props.right Its activity and history, each a section.
 * @returns The columns.
 */
export const RecordColumns = (props: { left: React.ReactNode; right: React.ReactNode }) => (
  <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
    <div className="flex min-w-0 flex-col gap-7">{props.left}</div>
    <div className="flex min-w-0 flex-col divide-y divide-rule rounded-lg bg-sidebar">
      {props.right}
    </div>
  </div>
);

/** A record section's row: 36 px, its hairline under it. */
export const SECTION_ROW = 'flex min-h-9 items-center gap-3 border-b border-rule py-1.5';

/** What a record section says when it has no rows, or under its rows. */
export const SECTION_NOTE = 'border-b border-rule py-2.5 text-[0.8125rem] text-muted-foreground';

/**
 * What a record panel shows while its record loads: the header and both columns in their places.
 * @returns The skeleton.
 */
export const RecordSkeleton = () => {
  const t = useTranslations('RecordPanel');

  return (
    <output aria-busy="true" className="block">
      <span className="sr-only">{t('loading')}</span>
      <div aria-hidden="true" className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-2.5 border-b border-rule pb-5">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-64 max-w-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }, (_, row) => (
              <Skeleton key={row} className="h-6 w-full" />
            ))}
          </div>
          <div className="flex flex-col gap-3 rounded-lg bg-sidebar p-5">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    </output>
  );
};

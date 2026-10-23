import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * A record's properties as an icon-labelled grid: each row its icon and label (12 px, slate) on
 * the left, its value (14 px) on the right; a property without a value reads "Not set".
 * @param props Component props.
 * @param props.label The grid's accessible name.
 * @param props.facts The properties, in order: an icon, a label and its value, if any.
 * @returns The grid.
 */
export const RecordFacts = (props: {
  label: string;
  facts: { icon: LucideIcon; label: string; value?: React.ReactNode }[];
}) => {
  const t = useTranslations('RecordFacts');

  return (
    <section aria-label={props.label}>
      <dl className="grid grid-cols-[minmax(7.5rem,10rem)_minmax(0,1fr)] gap-x-3">
        {props.facts.map((fact) => (
          <div key={fact.label} className="col-span-2 grid grid-cols-subgrid items-start py-1.5">
            <dt className="flex min-h-6 items-center gap-2 text-[0.75rem] font-medium text-muted-foreground">
              <fact.icon aria-hidden="true" className="size-3.5 shrink-0" />
              <span className="min-w-0 break-words">{fact.label}</span>
            </dt>
            <dd className="min-h-6 min-w-0 text-sm leading-6 break-words">
              {fact.value ?? <span className="text-muted-foreground">{t('not_set')}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

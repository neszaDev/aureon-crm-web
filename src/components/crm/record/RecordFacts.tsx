import { useTranslations } from 'next-intl';

/**
 * A record's details as labelled rows in one panel; a fact without a value reads "Not set".
 * @param props Component props.
 * @param props.label The panel's accessible name.
 * @param props.facts The facts, in order: a label and its value, if any.
 * @returns The panel.
 */
export const RecordFacts = (props: {
  label: string;
  facts: { label: string; value?: React.ReactNode }[];
}) => {
  const t = useTranslations('RecordFacts');

  return (
    <section aria-label={props.label} className="rounded-lg border border-rule bg-card">
      <dl>
        {props.facts.map((fact) => (
          <div
            key={fact.label}
            className="grid gap-0.5 border-t border-rule px-5 py-3 first:border-t-0 sm:grid-cols-[11rem_minmax(0,1fr)] sm:gap-4"
          >
            <dt className="text-[0.8125rem] font-medium text-muted-foreground sm:pt-0.5">
              {fact.label}
            </dt>
            <dd className="min-w-0 break-words">
              {fact.value ?? <span className="text-muted-foreground">{t('not_set')}</span>}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

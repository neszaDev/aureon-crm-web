import { useLocale, useTranslations } from 'next-intl';
import { Panel } from '@/components/crm/dashboard/Panel';
import type { components } from '@/libs/api/schema';
import { formatMoney } from '@/libs/crm/Format';

/**
 * The open pipeline as the API totals it: for each currency, the open amount and the weighted
 * amount (each deal at its probability), one under the other so the largest amount fits a phone.
 * Nothing is added across currencies; with more than one, the panel says so.
 * @param props Component props.
 * @param props.totals The dashboard's `openPipeline`.
 * @returns The panel.
 */
export const PipelineSummary = (props: { totals: components['schemas']['PipelineTotal'][] }) => {
  const t = useTranslations('PipelineSummary');
  const locale = useLocale();

  return (
    <Panel id="pipeline" title={t('title')}>
      {props.totals.length > 0 ? (
        <>
          <ul>
            {props.totals.map((total) => (
              <li key={total.currency} className="border-t border-rule px-4 py-3 sm:px-5">
                <h3 className="mb-1 text-sm font-semibold">{total.currency}</h3>
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-0.5">
                  <dt className="text-[0.8125rem] font-medium text-muted-foreground">
                    {t('open')}
                  </dt>
                  <dd className="text-right text-lg font-semibold tabular-nums">
                    {formatMoney(total.amount, total.currency, locale)}
                  </dd>
                  <dt className="text-[0.8125rem] font-medium text-muted-foreground">
                    {t('weighted')}
                  </dt>
                  <dd className="text-right tabular-nums">
                    {formatMoney(total.weightedAmount, total.currency, locale)}
                  </dd>
                </dl>
              </li>
            ))}
          </ul>
          <p className="mt-auto border-t border-rule px-4 py-3 text-[0.8125rem] text-muted-foreground sm:px-5">
            {t('weighted_hint')}
            {props.totals.length > 1 && ` ${t('per_currency')}`}
          </p>
        </>
      ) : (
        <p className="border-t border-rule px-4 py-6 text-muted-foreground sm:px-5">{t('empty')}</p>
      )}
    </Panel>
  );
};

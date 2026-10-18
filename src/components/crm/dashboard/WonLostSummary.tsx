import { useLocale, useTranslations } from 'next-intl';
import { Panel } from '@/components/crm/dashboard/Panel';
import type { components } from '@/libs/api/schema';
import { formatMoney } from '@/libs/crm/Format';

/**
 * The deals closed in the period, as the API counts them: how many were won, with their totals
 * for each currency (never added across), and how many were lost. Only these follow the period;
 * the panel says the rest of the page is as of now. The period itself is the picker's, which the
 * page puts in `action`.
 * @param props Component props.
 * @param props.won The dashboard's `won`.
 * @param props.lost The dashboard's `lost`.
 * @param props.action The period picker.
 * @returns The panel.
 */
export const WonLostSummary = (props: {
  won: components['schemas']['WonSummary'];
  lost: components['schemas']['LostSummary'];
  action?: React.ReactNode;
}) => {
  const t = useTranslations('WonLostSummary');
  const locale = useLocale();

  return (
    <Panel id="won-lost" title={t('title')} aside={props.action}>
      <dl className="grid grid-cols-2 gap-x-4 border-t border-rule px-4 py-4 sm:px-5">
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="text-[0.8125rem] font-medium text-muted-foreground">{t('won')}</dt>
          <dd className="flex flex-col gap-1">
            <span className="text-lg font-semibold tabular-nums">
              {t('deals', { count: props.won.count })}
            </span>
            {props.won.totals.length > 0 ? (
              <ul className="flex flex-col gap-0.5 text-sm tabular-nums">
                {props.won.totals.map((total) => (
                  <li key={total.currency}>{formatMoney(total.amount, total.currency, locale)}</li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-muted-foreground">{t('won_none')}</span>
            )}
          </dd>
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <dt className="text-[0.8125rem] font-medium text-muted-foreground">{t('lost')}</dt>
          <dd>
            <span className="text-lg font-semibold tabular-nums">
              {t('deals', { count: props.lost.count })}
            </span>
          </dd>
        </div>
      </dl>
      <p className="border-t border-rule px-4 py-3 text-[0.8125rem] text-muted-foreground sm:px-5">
        {t('scope')}
      </p>
    </Panel>
  );
};

import { PlusIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { DealStatusBadge } from '@/components/crm/deal/DealStatusBadge';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import { formatMoney, recordNumber } from '@/libs/crm/Format';
import { Link } from '@/libs/I18nNavigation';

/**
 * A company's or contact's deals on its page: how many active deals it has, the first of them
 * (name over its number, stage with its status, amount), a link to all of them in the deals
 * list, and a new deal already linked to this record.
 * @param props Component props.
 * @param props.deals The first active deals of the record, most recently updated first.
 * @param props.total How many active deals it has.
 * @param props.dealsPath The deals page; a deal's page is under it.
 * @param props.filter The param that filters the list to this record (`companyId` or
 *   `contactId`) and the record's id; the new deal takes the same link.
 * @param props.headingId The panel heading's id (a page may hold two such panels).
 * @returns The panel.
 */
export const RecordDeals = (props: {
  deals: components['schemas']['DealSummary'][];
  total: number;
  dealsPath: string;
  filter: { param: 'companyId' | 'contactId'; id: number };
  headingId: string;
}) => {
  const t = useTranslations('RecordDeals');
  const locale = useLocale();
  const link = `${props.filter.param}=${props.filter.id}`;

  return (
    <section aria-labelledby={props.headingId} className="rounded-lg border border-rule bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 id={props.headingId} className="flex items-baseline gap-2 font-semibold">
          {t('title')}
          <span className="text-sm font-normal text-muted-foreground tabular-nums">
            {t('count', { count: props.total })}
          </span>
        </h2>
        <Button asChild variant="outline">
          <Link href={`${props.dealsPath}/new?${link}`}>
            <PlusIcon data-icon="inline-start" />
            {t('new')}
          </Link>
        </Button>
      </div>
      {props.deals.length > 0 ? (
        <ul>
          {props.deals.map((deal) => (
            <li
              key={deal.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-rule px-5 py-3"
            >
              <span className="flex min-w-0 flex-1 basis-48 flex-wrap items-baseline gap-x-2">
                <Link
                  href={`${props.dealsPath}/${deal.id}`}
                  className="text-[0.9375rem] font-medium break-words text-foreground"
                >
                  {deal.name}
                </Link>
                <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                  {recordNumber('deal', deal.id)}
                </span>
              </span>
              <span className="flex items-center gap-2 text-sm">
                {deal.stage.name}
                <DealStatusBadge status={deal.status} />
              </span>
              <span className="font-medium tabular-nums">
                {formatMoney(deal.amount, deal.currency, locale)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-rule px-5 py-4 text-muted-foreground">{t('empty')}</p>
      )}
      {props.total > props.deals.length && (
        <p className="border-t border-rule px-5 py-3">
          <Link href={`${props.dealsPath}?view=list&${link}`} className="font-medium text-seal-ink">
            {t('view_all', { count: props.total })}
          </Link>
        </p>
      )}
    </section>
  );
};

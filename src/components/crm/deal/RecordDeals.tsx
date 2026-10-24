import { PlusIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { SECTION_NOTE, SECTION_ROW } from '@/components/crm/record/RecordLayout';
import { RecordSection } from '@/components/crm/record/RecordSection';
import { StatusPill } from '@/components/crm/StatusPill';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import { formatMoney, recordNumber } from '@/libs/crm/Format';
import type { StageRef } from '@/libs/crm/Stages';
import { stageTone } from '@/libs/crm/StatusColors';
import { Link } from '@/libs/I18nNavigation';

/**
 * A company's or contact's deals on its page: how many active deals it has, the first of them as
 * compact rows (name and number, its stage as its pill, amount), a link to all of them in the
 * deals list, and a new deal already linked to this record.
 * @param props Component props.
 * @param props.deals The first active deals of the record, most recently updated first.
 * @param props.total How many active deals it has.
 * @param props.stages The pipeline's stages, in order, for the pills' colours.
 * @param props.dealsPath The deals page; a deal's page is under it.
 * @param props.filter The param that filters the list to this record (`companyId` or
 *   `contactId`) and the record's id; the new deal takes the same link.
 * @param props.headingId The section heading's id (a page may hold two such sections).
 * @returns The section.
 */
export const RecordDeals = (props: {
  deals: components['schemas']['DealSummary'][];
  total: number;
  stages: StageRef[];
  dealsPath: string;
  filter: { param: 'companyId' | 'contactId'; id: number };
  headingId: string;
}) => {
  const t = useTranslations('RecordDeals');
  const tTable = useTranslations('DealTable');
  const locale = useLocale();
  const link = `${props.filter.param}=${props.filter.id}`;

  return (
    <RecordSection
      headingId={props.headingId}
      title={t('title')}
      count={t('count', { count: props.total })}
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href={`${props.dealsPath}/new?${link}`}>
            <PlusIcon data-icon="inline-start" />
            {t('new')}
          </Link>
        </Button>
      }
    >
      {props.deals.length > 0 ? (
        <ul>
          {props.deals.map((deal) => (
            <li key={deal.id} className={SECTION_ROW}>
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <Link
                  href={`${props.dealsPath}/${deal.id}`}
                  title={deal.name}
                  className="truncate text-sm font-medium text-foreground no-underline hover:underline"
                >
                  {deal.name}
                </Link>
                <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">
                  {recordNumber('deal', deal.id)}
                </span>
              </span>
              <StatusPill
                tone={stageTone(props.stages, deal.stage.id)}
                label={deal.stage.name}
                field={tTable('stage')}
                className="max-w-32"
              />
              <span className="shrink-0 text-sm font-medium tabular-nums">
                {formatMoney(deal.amount, deal.currency, locale)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={SECTION_NOTE}>{t('empty')}</p>
      )}
      {props.total > props.deals.length && (
        <Link
          href={`${props.dealsPath}?view=list&${link}`}
          className="flex h-9 items-center text-[0.8125rem] font-medium text-violet-ink"
        >
          {t('view_all', { count: props.total })}
        </Link>
      )}
    </RecordSection>
  );
};

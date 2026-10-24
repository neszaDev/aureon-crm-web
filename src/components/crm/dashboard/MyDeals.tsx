import { useLocale, useTranslations } from 'next-intl';
import { Panel } from '@/components/crm/dashboard/Panel';
import { StatusTrack } from '@/components/crm/StatusTrack';
import type { components } from '@/libs/api/schema';
import { signaturesOf } from '@/libs/crm/DealHistory';
import { formatMoney, recordNumber } from '@/libs/crm/Format';
import type { StageRef } from '@/libs/crm/Stages';
import { Link } from '@/libs/I18nNavigation';

/**
 * The caller's most recently updated open deals as compact rows: each deal's name over its number
 * and company, its status track (which names whoever moved the deal into each stage it has
 * passed) and its amount, with how many there are and the link to all of them in the heading.
 * @param props Component props.
 * @param props.deals The deals (the first page of `GET /deals?status=OPEN&ownerId=<me>`, by
 *   `UPDATED_AT`).
 * @param props.total How many open deals the caller has in all.
 * @param props.stages The pipeline's stages, in order, for the status tracks.
 * @param props.workspaceId The workspace.
 * @param props.me The caller's user id, for the link to all their deals.
 * @param props.now The current time, which the days in the stage run to.
 * @param props.timeZone The workspace's time zone, for the dates.
 * @returns The panel.
 */
export const MyDeals = (props: {
  deals: components['schemas']['DealSummary'][];
  total: number;
  stages: StageRef[];
  workspaceId: number;
  me: number;
  now: Date;
  timeZone: string;
}) => {
  const t = useTranslations('MyDeals');
  const locale = useLocale();
  const base = `/app/${props.workspaceId}/deals`;

  return (
    <Panel
      id="my-deals"
      title={t('title')}
      aside={
        props.total > 0 && (
          <span className="flex items-baseline gap-3 text-[0.8125rem]">
            <span className="text-muted-foreground tabular-nums">
              {t('total', { count: props.total })}
            </span>
            <Link
              href={`${base}?view=list&status=OPEN&ownerId=${props.me}`}
              className="font-medium text-violet-ink"
            >
              {t('all')}
            </Link>
          </span>
        )
      }
    >
      {props.deals.length > 0 ? (
        <ul>
          {props.deals.map((deal) => (
            // A row: the deal over its number and company, its track, its amount; on a phone the
            // track takes the row's second line.
            <li
              key={deal.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 border-t border-rule px-4 py-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,15rem)_auto] sm:px-5"
            >
              <span className="col-start-1 row-start-1 flex min-w-0 flex-col">
                <Link
                  href={`${base}/${deal.id}`}
                  className="text-sm font-medium break-words text-foreground no-underline hover:underline"
                >
                  {deal.name}
                </Link>
                <span className="flex min-w-0 flex-wrap gap-x-2 text-[0.8125rem] text-muted-foreground">
                  <span className="font-mono tabular-nums">{recordNumber('deal', deal.id)}</span>
                  {deal.company && <span className="break-words">{deal.company.name}</span>}
                </span>
              </span>
              <StatusTrack
                stages={props.stages}
                stage={deal.stage}
                enteredAt={deal.stageEnteredAt}
                signatures={signaturesOf(deal.signatures)}
                now={props.now}
                timeZone={props.timeZone}
                className="col-span-2 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1"
              />
              <span className="col-start-2 row-start-1 text-right text-sm font-semibold tabular-nums sm:col-start-3">
                {formatMoney(deal.amount, deal.currency, locale)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        // One line and the next step: the panel's heading already says what is missing.
        <p className="px-4 pb-4 text-sm text-muted-foreground sm:px-5">
          {t.rich('empty', {
            link: (chunks) => (
              <Link href={`${base}/new`} className="font-medium text-violet-ink">
                {chunks}
              </Link>
            ),
          })}
        </p>
      )}
    </Panel>
  );
};

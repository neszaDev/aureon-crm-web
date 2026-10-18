import { useLocale, useTranslations } from 'next-intl';
import { Panel } from '@/components/crm/dashboard/Panel';
import { ListEmpty } from '@/components/crm/list/ListEmpty';
import { StampRow } from '@/components/crm/StampRow';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import { signaturesOf } from '@/libs/crm/DealHistory';
import { formatMoney, recordNumber } from '@/libs/crm/Format';
import type { StageRef } from '@/libs/crm/Stages';
import { Link } from '@/libs/I18nNavigation';

/**
 * The caller's most recently updated open deals: each with its number, name, company, amount and
 * its stamp row, compact, with the seal of whoever moved the deal into each stage it has passed.
 * @param props Component props.
 * @param props.deals The deals (the first page of `GET /deals?status=OPEN&ownerId=<me>`, by
 *   `UPDATED_AT`).
 * @param props.total How many open deals the caller has in all.
 * @param props.stages The pipeline's stages, in order, for the stamp rows.
 * @param props.workspaceId The workspace.
 * @param props.me The caller's user id, for the link to all their deals.
 * @param props.now The current time, which the days in the stage run to.
 * @returns The panel.
 */
export const MyDeals = (props: {
  deals: components['schemas']['DealSummary'][];
  total: number;
  stages: StageRef[];
  workspaceId: number;
  me: number;
  now: Date;
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
          <span className="text-sm text-muted-foreground tabular-nums">
            {t('total', { count: props.total })}
          </span>
        )
      }
    >
      {props.deals.length > 0 ? (
        <>
          <ul>
            {props.deals.map((deal) => (
              <li
                key={deal.id}
                className="flex flex-col gap-2 border-t border-rule px-4 py-3 sm:px-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-col">
                    <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
                      {recordNumber('deal', deal.id)}
                    </span>
                    <Link
                      href={`${base}/${deal.id}`}
                      className="text-[0.9375rem] font-medium break-words text-foreground"
                    >
                      {deal.name}
                    </Link>
                    {deal.company && (
                      <span className="text-sm break-words text-muted-foreground">
                        {deal.company.name}
                      </span>
                    )}
                  </div>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {formatMoney(deal.amount, deal.currency, locale)}
                  </span>
                </div>
                <StampRow
                  stages={props.stages}
                  current={{
                    stageId: deal.stage.id,
                    kind: deal.stage.kind,
                    enteredAt: deal.stageEnteredAt,
                  }}
                  signatures={signaturesOf(deal.signatures)}
                  now={props.now}
                  size="compact"
                />
              </li>
            ))}
          </ul>
          <div className="mt-auto border-t border-rule px-4 py-3 sm:px-5">
            <Link
              href={`${base}?view=list&status=OPEN&ownerId=${props.me}`}
              className="font-medium text-seal-ink"
            >
              {t('all')}
            </Link>
          </div>
        </>
      ) : (
        <ListEmpty
          variant="none"
          title={t('empty_title')}
          text={t('empty_text')}
          action={
            <Button asChild variant="outline">
              <Link href={`${base}/new`}>{t('new')}</Link>
            </Button>
          }
        />
      )}
    </Panel>
  );
};

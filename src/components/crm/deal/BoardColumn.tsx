'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from 'cn';
import { useLocale, useTranslations } from 'next-intl';
import type { components } from '@/libs/api/schema';
import { formatMoney } from '@/libs/crm/Format';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import { Link } from '@/libs/I18nNavigation';

/**
 * One stage of the board: its name, how many deals it holds and their total in each currency
 * (never added across currencies), then the cards, or a note that it is empty, and a link to the
 * list when it holds more than the cards shown. It is where a card can be dropped. Below 768 px
 * only the chosen column shows.
 * @param props Component props.
 * @param props.column The stage, its count and its totals, as the server counted them.
 * @param props.shown How many cards the server sent for it (at most 50).
 * @param props.selected Whether it is the chosen column, which shows on a phone.
 * @param props.path The deals page's path.
 * @param props.query The board's search and filters, which the link to the list keeps.
 * @param props.children The column's cards (list items).
 * @returns The column.
 */
export const BoardColumn = (props: {
  column: components['schemas']['BoardColumn'];
  shown: number;
  selected: boolean;
  path: string;
  query: Pick<ListQuery, 'params'>;
  children: React.ReactNode;
}) => {
  const t = useTranslations('BoardColumn');
  const locale = useLocale();
  const { stage, count, totals } = props.column;
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const headingId = `board-stage-${stage.id}`;

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-lg border border-rule bg-muted/50 p-3 transition-colors duration-150 motion-reduce:transition-none max-md:w-full md:w-72 md:shrink-0',
        isOver && 'border-foreground bg-muted',
        !props.selected && 'max-md:hidden',
      )}
    >
      <header className="flex flex-col gap-1 px-0.5">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id={headingId} className="font-semibold break-words">
            {stage.name}
          </h2>
          <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
            {t('count', { count })}
          </span>
        </div>
        {totals.length > 0 && (
          <ul aria-label={t('totals')} className="flex flex-col">
            {totals.map((total) => (
              <li key={total.currency} className="text-[0.9375rem] font-medium tabular-nums">
                {formatMoney(total.amount, total.currency, locale)}
              </li>
            ))}
          </ul>
        )}
      </header>
      {props.shown > 0 ? (
        <ul className="flex flex-col gap-2">{props.children}</ul>
      ) : (
        <p className="px-0.5 text-sm text-muted-foreground">{t('empty')}</p>
      )}
      {count > props.column.deals.length && (
        <p className="px-0.5 text-sm text-muted-foreground">
          {t.rich('more', {
            shown: props.column.deals.length,
            count,
            link: (chunks) => (
              <Link
                href={listHref(props.path, props.query, {
                  view: 'list',
                  stageId: String(stage.id),
                })}
                className="font-medium text-seal-ink"
              >
                {chunks}
              </Link>
            ),
          })}
        </p>
      )}
    </section>
  );
};

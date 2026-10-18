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
 * list when it holds more than the cards shown. It is where a card can be dropped. From 768 px
 * the Won and Lost stages are slim: the name, count and totals (whole amounts without their
 * cents) and a link to the list instead of cards, so the default pipeline fits in one frame.
 * Below 768 px only the chosen column shows, in full.
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
  const { setNodeRef, isOver } = useDroppable({ id: props.column.stage.id });
  const headingId = `board-stage-${props.column.stage.id}`;
  const slim = props.column.stage.kind !== 'OPEN';
  const listLink = listHref(props.path, props.query, {
    view: 'list',
    stageId: String(props.column.stage.id),
  });

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      className={cn(
        'flex min-w-0 flex-col gap-3 rounded-lg border border-rule p-1.5 transition-colors duration-150 motion-reduce:transition-none max-md:w-full',
        slim ? 'md:w-20 md:shrink-0' : 'md:max-w-80 md:min-w-[14.75rem] md:flex-1 md:basis-0',
        isOver && 'border-foreground bg-muted',
        !props.selected && 'max-md:hidden',
      )}
    >
      <header className={cn('flex flex-col gap-1 px-2.5', slim && 'md:px-0.5')}>
        <div
          className={cn(
            'flex items-baseline justify-between gap-2',
            slim && 'md:flex-col md:items-start md:gap-0',
          )}
        >
          <h2
            id={headingId}
            // Focusable: a card dropped here (slim, so it leaves the screen) hands the focus on.
            tabIndex={-1}
            className="rounded-sm font-semibold break-words"
          >
            {props.column.stage.name}
          </h2>
          <span
            className={cn(
              'shrink-0 text-sm text-muted-foreground tabular-nums',
              slim && 'md:text-xs',
            )}
          >
            {t('count', { count: props.column.count })}
          </span>
        </div>
        {props.column.totals.length > 0 && (
          <ul aria-label={t('totals')} className="flex flex-col">
            {props.column.totals.map((total) => (
              <li
                key={total.currency}
                className={cn('text-[0.9375rem] font-medium tabular-nums', slim && 'md:text-xs')}
              >
                {formatMoney(total.amount, total.currency, locale, { short: slim })}
              </li>
            ))}
          </ul>
        )}
        {slim && (
          <Link
            href={listLink}
            aria-label={t('view_list_label', { name: props.column.stage.name })}
            className="text-xs font-medium break-words text-seal-ink max-md:hidden"
          >
            {t('view_list')}
          </Link>
        )}
      </header>
      {props.shown > 0 ? (
        <ul className={cn('flex flex-col gap-2', slim && 'md:hidden')}>{props.children}</ul>
      ) : (
        <p className={cn('px-2.5 text-sm text-muted-foreground', slim && 'md:hidden')}>
          {t('empty')}
        </p>
      )}
      {props.column.count > props.column.deals.length && (
        <p className={cn('px-2.5 text-sm text-muted-foreground', slim && 'md:hidden')}>
          {t.rich('more', {
            shown: props.column.deals.length,
            count: props.column.count,
            link: (chunks) => (
              <Link href={listLink} className="font-medium text-seal-ink">
                {chunks}
              </Link>
            ),
          })}
        </p>
      )}
    </section>
  );
};

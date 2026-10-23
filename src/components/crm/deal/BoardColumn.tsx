'use client';

import { useDroppable } from '@dnd-kit/core';
import { cn } from 'cn';
import { ChevronsLeftRightIcon, ChevronsRightLeftIcon, ListIcon, PlusIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { components } from '@/libs/api/schema';
import { formatMoney } from '@/libs/crm/Format';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import type { StatusTone } from '@/libs/crm/StatusColors';
import { PILL } from '@/libs/crm/StatusColors';
import { Link } from '@/libs/I18nNavigation';

/**
 * One stage of the board, where a card can be dropped: its heading is the stage's pill with the
 * count beside it, then its total in each currency (never added across currencies), the cards
 * (or a note that it is empty), a link to the list when it holds more than the cards shown and,
 * for an open stage, "Add deal" (the create form in that stage). From 768 px Won and Lost start as
 * a 40 px strip: the pill and the count written down the strip, the totals without their cents
 * and a link to the list; the strip (all of it) expands into a whole column, cards and all, and
 * collapses back. Below 768 px only the chosen column shows, always whole.
 * @param props Component props.
 * @param props.column The stage, its count and its totals, as the server counted them.
 * @param props.shown How many cards the server sent for it (at most 50).
 * @param props.selected Whether it is the chosen column, which shows on a phone.
 * @param props.tone The stage's colour (`stageTone`).
 * @param props.path The deals page's path.
 * @param props.query The board's search and filters, which the link to the list keeps.
 * @param props.children The column's cards (list items).
 * @returns The column.
 */
export const BoardColumn = (props: {
  column: components['schemas']['BoardColumn'];
  shown: number;
  selected: boolean;
  tone: StatusTone;
  path: string;
  query: Pick<ListQuery, 'params'>;
  children: React.ReactNode;
}) => {
  const t = useTranslations('BoardColumn');
  const tDeals = useTranslations('DealsPage');
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const { stage, count } = props.column;
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const headingId = `board-stage-${stage.id}`;
  const cardsId = `board-cards-${stage.id}`;
  const closing = stage.kind !== 'OPEN';
  // From 768 px: a closed stage folded into its strip.
  const strip = closing && !expanded;
  const listLink = listHref(props.path, props.query, {
    view: 'list',
    stageId: String(stage.id),
  });

  return (
    <section
      ref={setNodeRef}
      aria-labelledby={headingId}
      data-tone={props.tone}
      className={cn(
        'relative flex min-w-0 flex-col gap-2 rounded-lg bg-sidebar p-1.5 max-md:w-full',
        strip
          ? 'md:w-10 md:shrink-0 md:items-center md:px-0'
          : 'md:max-w-80 md:min-w-56 md:flex-1 md:basis-0',
        // A card over it: ringed in the stage's colour.
        isOver && 'ring-2 ring-(--tone-ink) ring-inset',
        !props.selected && 'max-md:hidden',
      )}
    >
      <header className={cn('flex flex-col gap-1 px-1.5 pt-1', strip && 'md:items-center md:px-0')}>
        <div className={cn('flex min-w-0 items-center gap-2', strip && 'md:flex-col')}>
          {closing && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls={cardsId}
              // One name, "Won cards": its state is aria-expanded's.
              aria-label={t('cards', { name: stage.name })}
              onClick={(event) => {
                const column = event.currentTarget.closest('section');
                setExpanded(!expanded);
                // Expanded at the board's end, it would push itself (and this button) out of view.
                requestAnimationFrame(() => {
                  column?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                });
              }}
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring max-md:hidden',
                // Folded, the whole strip is the button.
                strip ? 'after:absolute after:inset-0 after:rounded-lg' : 'order-last ml-auto',
              )}
            >
              {strip ? (
                <ChevronsLeftRightIcon aria-hidden="true" className="size-4" />
              ) : (
                <ChevronsRightLeftIcon aria-hidden="true" className="size-4" />
              )}
            </button>
          )}
          <h2
            id={headingId}
            // Focusable: a card dropped on a strip leaves the screen, and hands the focus here.
            tabIndex={-1}
            className={cn(
              PILL,
              'outline-none focus-visible:ring-2 focus-visible:ring-ring',
              strip && 'md:h-auto md:w-6 md:py-2.5 md:[writing-mode:vertical-rl]',
            )}
          >
            <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-(--tone)" />
            <span title={stage.name} className="truncate">
              {stage.name}
            </span>
          </h2>
          <span
            aria-hidden="true"
            className="text-xs font-medium text-muted-foreground tabular-nums"
          >
            {count}
          </span>
          <span className="sr-only">{t('count', { count })}</span>
        </div>
        {props.column.totals.length > 0 && (
          <ul
            aria-label={t('totals')}
            className={cn(
              'flex flex-wrap gap-x-2 text-xs font-medium text-muted-foreground tabular-nums',
              strip && 'md:flex-col md:items-center md:gap-2',
            )}
          >
            {props.column.totals.map((total) => {
              const full = formatMoney(total.amount, total.currency, locale);
              const short = formatMoney(total.amount, total.currency, locale, { short: strip });

              return (
                <li key={total.currency} className={cn(strip && 'md:[writing-mode:vertical-rl]')}>
                  {short === full ? (
                    full
                  ) : (
                    // Short in the strip only: below 768 px the column is whole, cents and all.
                    <>
                      <span className="md:hidden">{full}</span>
                      <span className="max-md:hidden">{short}</span>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {closing && (
          <Link
            href={listLink}
            aria-label={t('view_list_label', { name: stage.name })}
            title={t('view_list')}
            // Above the strip's button.
            className="relative z-10 grid size-6 place-items-center self-start rounded-md text-muted-foreground hover:bg-accent hover:text-foreground max-md:hidden"
          >
            <ListIcon aria-hidden="true" className="size-4" />
          </Link>
        )}
      </header>
      <div id={cardsId} className={cn('flex flex-col gap-2', strip && 'md:hidden')}>
        {props.shown > 0 ? (
          <ul className="flex flex-col gap-1.5">{props.children}</ul>
        ) : (
          <p className="px-1.5 text-[0.8125rem] text-muted-foreground">{t('empty')}</p>
        )}
        {count > props.column.deals.length && (
          <p className="px-1.5 text-[0.8125rem] text-muted-foreground">
            {t.rich('more', {
              shown: props.column.deals.length,
              count,
              link: (chunks) => (
                <Link href={listLink} className="font-medium text-violet-ink">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        )}
        {!closing && (
          <Link
            href={`${props.path}/new?stageId=${stage.id}`}
            aria-label={tDeals('add_in', { stage: stage.name })}
            className="flex h-8 items-center gap-1.5 rounded-md px-1.5 text-[0.8125rem] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            {tDeals('new')}
          </Link>
        )}
      </div>
    </section>
  );
};

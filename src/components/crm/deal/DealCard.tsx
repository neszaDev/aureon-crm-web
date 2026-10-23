'use client';

import { useDraggable } from '@dnd-kit/core';
import { cn } from 'cn';
import { CalendarIcon, CircleAlertIcon, EllipsisIcon, GripVerticalIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import { StatusTrack } from '@/components/crm/StatusTrack';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { components } from '@/libs/api/schema';
import { signaturesOf } from '@/libs/crm/DealHistory';
import { formatDate, formatMoney, recordNumber } from '@/libs/crm/Format';
import type { StageRef } from '@/libs/crm/Stages';
import { toLocalInput } from '@/libs/crm/ZonedTime';
import { Link } from '@/libs/I18nNavigation';

type Deal = components['schemas']['DealSummary'];

/**
 * What a board card shows: the deal's number, its name (a link to the deal), its company, its
 * amount, its owner's avatar, its status track (each segment names who moved the deal there) and
 * its expected close date, in danger red with an icon and words once an open deal is past it. The
 * dragged copy shows the same, without controls.
 * @param props Component props.
 * @param props.deal The deal.
 * @param props.workspaceId The workspace.
 * @param props.stages The pipeline's stages, in order, for the status track.
 * @param props.now The current time, for the days in the stage and the past close date.
 * @param props.timeZone The workspace's time zone, for the dates.
 * @param props.controls The drag handle and the menu, when the caller may move the deal.
 * @param props.className Extra classes, such as the lifted look of the dragged copy.
 * @returns The card's body.
 */
export const DealCardBody = (props: {
  deal: Deal;
  workspaceId: number;
  stages: StageRef[];
  now: Date;
  timeZone: string;
  controls?: React.ReactNode;
  className?: string;
}) => {
  const t = useTranslations('DealCard');
  const locale = useLocale();
  const close = props.deal.expectedCloseDate;
  const today = toLocalInput(props.now.toISOString(), props.timeZone).slice(0, 10);
  const past = close !== undefined && props.deal.status === 'OPEN' && close < today;

  return (
    <div
      className={cn(
        'flex flex-col gap-2 rounded-lg border border-rule bg-card p-3 pt-2 transition-shadow duration-150 hover:shadow-float motion-reduce:transition-none',
        props.className,
      )}
    >
      <div className="flex flex-col gap-0.5">
        {/* The controls share the number's line, so the name has the card's whole width. */}
        <div className="flex h-6 items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {recordNumber('deal', props.deal.id)}
          </span>
          {props.controls}
        </div>
        <Link
          href={`/app/${props.workspaceId}/deals/${props.deal.id}`}
          className="text-sm leading-5 font-medium break-words text-foreground"
        >
          {props.deal.name}
        </Link>
        {props.deal.company && (
          <span className="text-[0.8125rem] break-words text-muted-foreground">
            {props.deal.company.name}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold tabular-nums">
          {formatMoney(props.deal.amount, props.deal.currency, locale)}
        </span>
        {props.deal.owner && (
          <PersonAvatar
            person={props.deal.owner}
            size="sm"
            title={props.deal.owner.displayName ?? props.deal.owner.email}
          />
        )}
      </div>
      <StatusTrack
        stages={props.stages}
        stage={props.deal.stage}
        enteredAt={props.deal.stageEnteredAt}
        signatures={signaturesOf(props.deal.signatures)}
        now={props.now}
        timeZone={props.timeZone}
      />
      {close && (
        <span
          className={cn(
            'flex items-center gap-1.5 text-xs tabular-nums',
            past ? 'font-medium text-danger' : 'text-muted-foreground',
          )}
        >
          {past ? (
            <CircleAlertIcon aria-hidden="true" className="size-3.5 shrink-0" />
          ) : (
            <CalendarIcon aria-hidden="true" className="size-3.5 shrink-0" />
          )}
          {past
            ? t('close_past', { date: formatDate(close, locale) })
            : t('close', { date: formatDate(close, locale) })}
        </span>
      )}
    </div>
  );
};

/**
 * One card of a board column. A deal the caller may move (`movable`) has a drag handle, which
 * the pointer and the keyboard both use (from 768 px up), and a menu with "Move to…", which is
 * how a phone moves it; both show on hover (where there is hover) or focus, and always on a
 * touch screen. Without the right to move it the card has neither. A deal whose move is on its
 * way (`busy`) can't be picked up again, nor moved from its menu.
 * @param props Component props.
 * @param props.deal The deal.
 * @param props.workspaceId The workspace.
 * @param props.stages The pipeline's stages, in order, for the status track.
 * @param props.now The current time, for the days in the stage and the past close date.
 * @param props.timeZone The workspace's time zone, for the dates.
 * @param props.movable Whether the caller may move the deal.
 * @param props.busy Whether a move of it is on its way.
 * @param props.onMoveTo Opens the "Move to…" dialog.
 * @returns The list item.
 */
export const DealCard = (props: {
  deal: Deal;
  workspaceId: number;
  stages: StageRef[];
  now: Date;
  timeZone: string;
  movable: boolean;
  busy: boolean;
  onMoveTo: () => void;
}) => {
  const t = useTranslations('DealCard');
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: props.deal.id,
    disabled: !props.movable || props.busy,
    attributes: { roleDescription: t('drag_role') },
  });
  const number = recordNumber('deal', props.deal.id);

  return (
    <li ref={setNodeRef} className="group/card">
      <DealCardBody
        deal={props.deal}
        workspaceId={props.workspaceId}
        stages={props.stages}
        now={props.now}
        timeZone={props.timeZone}
        className={cn(isDragging && 'opacity-40', props.busy && 'opacity-70')}
        controls={
          props.movable && (
            <span className="-my-1.5 -mr-1.5 flex shrink-0 items-center md:group-focus-within/card:opacity-100 md:group-hover/card:opacity-100 md:has-[[data-state=open]]:opacity-100 [@media(hover:hover)]:md:opacity-0">
              <Button
                ref={setActivatorNodeRef}
                id={`deal-handle-${props.deal.id}`}
                variant="ghost"
                size="icon-sm"
                className="cursor-grab touch-none active:cursor-grabbing max-md:hidden"
                aria-label={t('drag', { number, name: props.deal.name })}
                {...attributes}
                {...listeners}
              >
                <GripVerticalIcon />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    id={`deal-menu-${props.deal.id}`}
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t('actions', { name: props.deal.name })}
                  >
                    <EllipsisIcon />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-auto min-w-40">
                  <DropdownMenuItem disabled={props.busy} onSelect={props.onMoveTo}>
                    {t('move_to')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          )
        }
      />
    </li>
  );
};

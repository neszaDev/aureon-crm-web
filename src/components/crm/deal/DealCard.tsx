'use client';

import { useDraggable } from '@dnd-kit/core';
import { cn } from 'cn';
import { EllipsisIcon, GripVerticalIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Seal } from '@/components/crm/Seal';
import { StampRow } from '@/components/crm/StampRow';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { components } from '@/libs/api/schema';
import { formatDate, formatMoney, recordNumber } from '@/libs/crm/Format';
import type { StageRef } from '@/libs/crm/Stages';
import { Link } from '@/libs/I18nNavigation';

type Deal = components['schemas']['DealSummary'];

/**
 * What a board card shows: the deal's number in mono, its name (a link to the deal), its company,
 * its amount, its owner's seal, a compact stamp row and the expected close date. The dragged
 * copy shows the same, without controls.
 * @param props Component props.
 * @param props.deal The deal.
 * @param props.workspaceId The workspace.
 * @param props.stages The pipeline's stages, in order, for the stamp row.
 * @param props.now The current time, for the days in the stage.
 * @param props.controls The drag handle and the menu, when the caller may move the deal.
 * @param props.className Extra classes, such as the lifted look of the dragged copy.
 * @returns The card's body.
 */
export const DealCardBody = (props: {
  deal: Deal;
  workspaceId: number;
  stages: StageRef[];
  now: Date;
  controls?: React.ReactNode;
  className?: string;
}) => {
  const t = useTranslations('DealCard');
  const locale = useLocale();

  return (
    <div
      className={cn(
        'flex flex-col gap-2.5 rounded-md border border-rule bg-card px-3 py-2.5',
        props.className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="font-mono text-[0.8125rem] text-muted-foreground tabular-nums">
            {recordNumber('deal', props.deal.id)}
          </span>
          <Link
            href={`/app/${props.workspaceId}/deals/${props.deal.id}`}
            className="text-[0.9375rem] font-medium break-words text-foreground"
          >
            {props.deal.name}
          </Link>
        </div>
        {props.controls}
      </div>
      {props.deal.company && (
        <span className="text-sm break-words text-muted-foreground">{props.deal.company.name}</span>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold tabular-nums">
          {formatMoney(props.deal.amount, props.deal.currency, locale)}
        </span>
        {props.deal.owner && (
          <Seal
            name={props.deal.owner.displayName}
            email={props.deal.owner.email}
            size="sm"
            title={props.deal.owner.displayName ?? props.deal.owner.email}
          />
        )}
      </div>
      <StampRow
        stages={props.stages}
        current={{
          stageId: props.deal.stage.id,
          kind: props.deal.stage.kind,
          enteredAt: props.deal.stageEnteredAt,
        }}
        now={props.now}
        size="compact"
      />
      {props.deal.expectedCloseDate && (
        <span className="text-sm text-muted-foreground tabular-nums">
          {t('close', { date: formatDate(props.deal.expectedCloseDate, locale) })}
        </span>
      )}
    </div>
  );
};

/**
 * One card of a board column. A deal the caller may move (`movable`) has a drag handle, which
 * the pointer and the keyboard both use (from 768 px up), and a menu with "Move to…", which is
 * how a phone moves it; both show on hover (where there is hover) or focus, and always on a touch screen. Without the right to move it the card has
 * neither. A deal whose move is on its way (`busy`) can't be picked up again.
 * @param props Component props.
 * @param props.deal The deal.
 * @param props.workspaceId The workspace.
 * @param props.stages The pipeline's stages, in order, for the stamp row.
 * @param props.now The current time, for the days in the stage.
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
        className={cn(isDragging && 'opacity-40', props.busy && 'opacity-70')}
        controls={
          props.movable && (
            <span className="-mt-1 -mr-1.5 flex shrink-0 items-center md:group-focus-within/card:opacity-100 md:group-hover/card:opacity-100 md:has-[[data-state=open]]:opacity-100 [@media(hover:hover)]:md:opacity-0">
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
                  <DropdownMenuItem onSelect={props.onMoveTo}>{t('move_to')}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </span>
          )
        }
      />
    </li>
  );
};

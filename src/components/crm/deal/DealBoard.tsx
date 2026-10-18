'use client';

import type { KeyboardCoordinateGetter, UniqueIdentifier } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import type { MoveResult } from '@/actions/crm/DealActions';
import { moveDeal } from '@/actions/crm/DealActions';
import { BoardColumn } from '@/components/crm/deal/BoardColumn';
import { DealCard, DealCardBody } from '@/components/crm/deal/DealCard';
import { LostReasonDialog } from '@/components/crm/deal/LostReasonDialog';
import { MoveDealDialog } from '@/components/crm/deal/MoveDealDialog';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { components } from '@/libs/api/schema';
import type { ListQuery } from '@/libs/crm/ListQuery';
import type { Permission } from '@/libs/crm/Permissions';
import { canEditRecord } from '@/libs/crm/RecordAccess';
import { toastActionFailure } from '@/utils/ActionToast';

type Column = components['schemas']['BoardColumn'];
type Deal = components['schemas']['DealSummary'];
type Stage = Column['stage'];

/** A card moved here ahead of the server: where it went, and the version to move it from next. */
type PendingMove = { stageId: number; version: number; at: string; settled: boolean };

/**
 * The column next to the one a card is over (the one whose centre is nearest to the card's).
 * @param columns The columns' rectangles, left to right.
 * @param centre The horizontal centre of the dragged card.
 * @param direction 1 for the column to the right, -1 for the left.
 * @returns The neighbour's rectangle, if there is one.
 */
const neighbour = (
  columns: { left: number; width: number }[],
  centre: number,
  direction: number,
) => {
  let nearest = 0;
  for (const [index, rect] of columns.entries()) {
    const best = columns[nearest];
    if (
      best &&
      Math.abs(rect.left + rect.width / 2 - centre) < Math.abs(best.left + best.width / 2 - centre)
    ) {
      nearest = index;
    }
  }

  return columns[nearest + direction];
};

/**
 * The keyboard's way across the board: Left and Right jump to the neighbouring column (the
 * default steps are a few pixels, which never reach one), keeping the card's height.
 * @param event The key press.
 * @param args The drag's context.
 * @param args.context The active drag, the dragged rectangle and the droppable columns.
 * @returns The new top-left corner of the dragged card, or nothing for another key.
 */
const columnCoordinates: KeyboardCoordinateGetter = (event, args) => {
  const { collisionRect, droppableRects, droppableContainers } = args.context;
  const direction = { ArrowRight: 1, ArrowLeft: -1 }[event.code];
  if (direction !== undefined) {
    event.preventDefault();
  }
  const columns = droppableContainers
    .getEnabled()
    .flatMap((container) => {
      const rect = droppableRects.get(container.id);
      return rect ? [rect] : [];
    })
    .toSorted((a, b) => a.left - b.left);
  const target =
    collisionRect && direction !== undefined
      ? neighbour(columns, collisionRect.left + collisionRect.width / 2, direction)
      : undefined;

  return collisionRect && target
    ? { x: target.left + (target.width - collisionRect.width) / 2, y: collisionRect.top }
    : undefined;
};

/**
 * A column of the board under the pointer, else the nearest one (the keyboard has no pointer).
 * @param args The drag's context.
 * @returns The colliding columns.
 */
const collideColumns: typeof closestCenter = (args) => {
  const within = pointerWithin(args);

  return within.length > 0 ? within : closestCenter(args);
};

/**
 * The deal board: one column per stage, in order, each with its count, totals per currency and
 * cards. A card the caller may move is dragged to another column with the pointer or the keyboard
 * (Space to pick up, Left and Right to cross columns, Space to drop), or moved from its menu.
 * A drop moves the card at once and asks the backend (`moveDeal`); a refusal or a failed request
 * puts the card back and says why in a toast (a stale version with a reload). A drop on Lost asks
 * for the reason first: the card stays where it was until it is given, and cancelling moves
 * nothing. Once saved, the server's refresh brings the counts, totals and cards as they are.
 * Below 768 px one column shows at a time, chosen with a select, and the menu moves cards.
 * @param props Component props.
 * @param props.workspaceId The workspace.
 * @param props.columns The board from the server: every stage in order with up to 50 deals.
 * @param props.me The caller's user id.
 * @param props.permissions The caller's permissions, which decide whose deals they may move.
 * @param props.path The deals page's path.
 * @param props.query The board's search and filters, which the link to the list keeps.
 * @param props.now The current time, for the days in each stage.
 * @returns The board.
 */
export const DealBoard = (props: {
  workspaceId: number;
  columns: Column[];
  me: number;
  permissions: Permission[];
  path: string;
  query: Pick<ListQuery, 'params'>;
  now: Date;
}) => {
  const t = useTranslations('DealBoard');
  const tError = useTranslations('ActionError');
  const [moves, setMoves] = useState<Record<number, PendingMove>>({});
  // The columns the last render took the pending moves against: a refresh brings new ones, and
  // a move the server has answered is then in them.
  const [seen, setSeen] = useState(props.columns);
  const [asking, setAsking] = useState<{ deal: Deal; stage: Stage }>();
  const [menuDeal, setMenuDeal] = useState<Deal>();
  const [dragging, setDragging] = useState<Deal>();
  const [selected, setSelected] = useState(props.columns[0]?.stage.id);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // `auto`: the board scrolls to the next column at once (the default glides, and a quick
    // Space would drop the card before it got there).
    useSensor(KeyboardSensor, { coordinateGetter: columnCoordinates, scrollBehavior: 'auto' }),
  );
  const inFlight = useRef(new Set<number>());

  if (props.columns !== seen) {
    setSeen(props.columns);
    setMoves((current) =>
      Object.fromEntries(Object.entries(current).filter(([, move]) => !move.settled)),
    );
  }

  const stages = props.columns.map((column) => column.stage);
  const stageRefs = stages.map(({ id, name, kind }) => ({ id, name, kind }));
  const shownColumn = props.columns.some((column) => column.stage.id === selected)
    ? selected
    : props.columns[0]?.stage.id;
  // Each deal where the caller's pending moves put it, those moved ahead of the server first.
  const placed = props.columns.flatMap((column) =>
    column.deals.map((deal) => {
      const move = moves[deal.id];
      const target = move && stages.find((stage) => stage.id === move.stageId);
      if (!move || !target || target.id === deal.stage.id) {
        return { deal, moved: false };
      }

      return {
        moved: true,
        deal: {
          ...deal,
          stage: { id: target.id, name: target.name, kind: target.kind },
          status: target.kind,
          stageEnteredAt: move.at,
          version: Math.max(deal.version, move.version),
        },
      };
    }),
  );
  const dealOf = (id: UniqueIdentifier) => placed.find((item) => item.deal.id === id)?.deal;

  const startMove = async (deal: Deal, stage: Stage, lostReason?: string) => {
    if (inFlight.current.has(deal.id)) {
      return;
    }
    inFlight.current.add(deal.id);
    setMoves((current) => ({
      ...current,
      [deal.id]: {
        stageId: stage.id,
        version: deal.version,
        at: new Date().toISOString(),
        settled: false,
      },
    }));
    let result: MoveResult;
    try {
      result = await moveDeal(props.workspaceId, deal.id, {
        stageId: stage.id,
        version: deal.version,
        lostReason,
      });
    } catch {
      // Nothing came back: the deal is where the server last said, so the card goes back.
      result = { ok: false, message: t('error_network') };
    }
    inFlight.current.delete(deal.id);
    if (result.ok) {
      const version = result.version ?? deal.version;
      setMoves((current) => {
        const move = current[deal.id];
        return move ? { ...current, [deal.id]: { ...move, version, settled: true } } : current;
      });
    } else {
      setMoves((current) =>
        Object.fromEntries(Object.entries(current).filter(([id]) => Number(id) !== deal.id)),
      );
      toastActionFailure(result, t('error_generic'), tError('reload'));
    }
  };

  const nameOf = (id: UniqueIdentifier) => dealOf(id)?.name ?? '';
  const stageName = (id: UniqueIdentifier) => stages.find((stage) => stage.id === id)?.name ?? '';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 md:hidden">
        <Label htmlFor="board-stage">{t('stage_select')}</Label>
        <NativeSelect
          id="board-stage"
          value={shownColumn}
          onChange={(event) => {
            setSelected(Number(event.target.value));
          }}
        >
          {props.columns.map((column) => (
            <NativeSelectOption key={column.stage.id} value={column.stage.id}>
              {t('stage_option', { name: column.stage.name, count: column.count })}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <DndContext
        // A fixed id keeps its generated aria ids the same on the server and in the browser.
        id="deal-board"
        sensors={sensors}
        collisionDetection={collideColumns}
        accessibility={{
          screenReaderInstructions: { draggable: t('drag_instructions') },
          announcements: {
            onDragStart: (event) => t('drag_start', { name: nameOf(event.active.id) }),
            onDragOver: (event) =>
              event.over
                ? t('drag_over', {
                    name: nameOf(event.active.id),
                    stage: stageName(event.over.id),
                  })
                : t('drag_away', { name: nameOf(event.active.id) }),
            onDragEnd: (event) =>
              event.over
                ? t('drag_end', { name: nameOf(event.active.id), stage: stageName(event.over.id) })
                : t('drag_cancel', { name: nameOf(event.active.id) }),
            onDragCancel: (event) => t('drag_cancel', { name: nameOf(event.active.id) }),
          },
        }}
        onDragStart={(event) => {
          setDragging(dealOf(event.active.id));
        }}
        onDragCancel={() => {
          setDragging(undefined);
        }}
        onDragEnd={(event) => {
          setDragging(undefined);
          const deal = dealOf(event.active.id);
          const stage = stages.find((item) => item.id === event.over?.id);
          if (!deal || !stage || stage.id === deal.stage.id) {
            return;
          }
          if (stage.kind === 'LOST') {
            // Not moved yet: the reason comes first.
            setAsking({ deal, stage });
          } else {
            void startMove(deal, stage);
          }
        }}
      >
        <div className="flex items-stretch gap-3 md:overflow-x-auto md:pb-2">
          {props.columns.map((column) => {
            const cards = placed
              .filter((item) => item.deal.stage.id === column.stage.id)
              .toSorted((a, b) => Number(b.moved) - Number(a.moved));

            return (
              <BoardColumn
                key={column.stage.id}
                column={column}
                shown={cards.length}
                selected={column.stage.id === shownColumn}
                path={props.path}
                query={props.query}
              >
                {cards.map(({ deal }) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    workspaceId={props.workspaceId}
                    stages={stageRefs}
                    now={props.now}
                    movable={canEditRecord(
                      { permissions: props.permissions },
                      props.me,
                      deal.owner?.userId,
                    )}
                    busy={moves[deal.id]?.settled === false}
                    onMoveTo={() => {
                      setMenuDeal(deal);
                    }}
                  />
                ))}
              </BoardColumn>
            );
          })}
        </div>
        {/* No glide home after a drop: the card has already moved, or been put back, and a glide
            toward a card that moved again (a refused move) leaves the copy stuck on screen. */}
        <DragOverlay dropAnimation={null}>
          {dragging && (
            <DealCardBody
              deal={dragging}
              workspaceId={props.workspaceId}
              stages={stageRefs}
              now={props.now}
              className="shadow-sheet"
            />
          )}
        </DragOverlay>
      </DndContext>
      <LostReasonDialog
        open={asking !== undefined}
        onOpenChange={(open) => {
          if (!open) {
            setAsking(undefined);
          }
        }}
        dealName={asking?.deal.name ?? ''}
        onConfirm={(reason) => {
          if (asking) {
            void startMove(asking.deal, asking.stage, reason);
          }
        }}
      />
      {menuDeal && (
        <MoveDealDialog
          workspaceId={props.workspaceId}
          deal={{
            id: menuDeal.id,
            name: menuDeal.name,
            version: menuDeal.version,
            stageId: menuDeal.stage.id,
          }}
          stages={stageRefs}
          open
          onOpenChange={(open) => {
            if (!open) {
              setMenuDeal(undefined);
            }
          }}
          returnFocus={() => document.querySelector<HTMLElement>(`#deal-menu-${menuDeal.id}`)}
        />
      )}
    </div>
  );
};

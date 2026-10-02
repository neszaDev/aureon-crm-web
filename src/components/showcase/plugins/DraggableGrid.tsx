'use client';

import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { cn } from 'cn';
import {
  ExternalLinkIcon,
  GripVerticalIcon,
  MoveHorizontalIcon,
  MoveVerticalIcon,
  PinIcon,
  RotateCcwIcon,
  SaveIcon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { CardAccent, GridCard } from './data';
import { BASE_LAYOUT } from './data';
import { moveCard, parseStoredLayout, toggleCardSize } from './draggableLayout';
import { readSavedLayout, saveLayout, subscribeToSavedLayout } from './layoutStorage';

const ACCENTS: Record<CardAccent, string> = {
  folder: 'border-t-folder',
  'ink-950': 'border-t-ink-950',
  'ink-700': 'border-t-ink-700',
  'ink-600': 'border-t-ink-600',
  'ink-400': 'border-t-ink-400',
  'ink-300': 'border-t-ink-300',
};

type CardOptions = { draggable: boolean; resizable: boolean };

/**
 * The printed face of one grid card, shared by the grid and the drag overlay.
 * @param props Component props.
 * @param props.card The card.
 * @param props.title The card's title.
 * @param props.handle The drag handle, when the card can move.
 * @param props.tools The size toggles, when the card can be resized.
 * @param props.lifted Whether the card is the copy following the pointer.
 * @returns The card face.
 */
const CardFace = (props: {
  card: GridCard;
  title: string;
  handle?: React.ReactNode;
  tools?: React.ReactNode;
  lifted?: boolean;
}) => {
  const t = useTranslations('DraggableGrid');

  return (
    <div
      className={cn(
        'flex h-full flex-col rounded-sm border border-t-[3px] border-ink-200 bg-paper-card',
        ACCENTS[props.card.accent],
        props.card.tall ? 'min-h-64' : 'min-h-44',
        props.lifted ? 'shadow-paper' : 'shadow-sheet',
      )}
    >
      <div className="flex items-center gap-2 border-b border-ink-200 px-3 py-2.5">
        {props.handle}
        {props.card.pinned && <PinIcon aria-hidden="true" className="size-4 text-ink-600" />}
        <h3 className="min-w-0 flex-1 truncate font-semibold text-ink-950">{props.title}</h3>
        {props.tools}
      </div>
      <p className="p-4 text-[0.9375rem] leading-relaxed text-ink-700">
        {props.card.pinned ? t('pinned_text') : t('card_text')}
      </p>
    </div>
  );
};

/**
 * One sortable card of the grid.
 * @param props Component props.
 * @param props.card The card.
 * @param props.title The card's title.
 * @param props.options Whether dragging and resizing are on.
 * @param props.onToggleSize Flips the card's width or height.
 * @returns The list item.
 */
const SortableCard = (props: {
  card: GridCard;
  title: string;
  options: CardOptions;
  onToggleSize: (dimension: 'wide' | 'tall') => void;
}) => {
  const t = useTranslations('DraggableGrid');
  const canDrag = props.options.draggable && !props.card.pinned;
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, isDragging, isOver } =
    useSortable({
      id: props.card.id,
      // A pinned card is neither dragged nor a drop target.
      disabled: { draggable: !canDrag, droppable: props.card.pinned },
    });

  return (
    <li
      ref={setNodeRef}
      data-testid={`grid-card-${props.card.id}`}
      className={cn(
        'list-none rounded-sm',
        props.card.wide && 'sm:col-span-2',
        isDragging && 'outline-2 outline-ink-400 outline-dashed *:invisible',
        isOver && !isDragging && 'outline-2 outline-offset-2 outline-folder outline-dashed',
      )}
    >
      <CardFace
        card={props.card}
        title={props.title}
        handle={
          canDrag && (
            <Button
              ref={setActivatorNodeRef}
              variant="ghost"
              size="icon-xs"
              className="cursor-grab touch-none active:cursor-grabbing"
              aria-label={t('move_card', { card: props.title })}
              {...attributes}
              {...listeners}
            >
              <GripVerticalIcon />
            </Button>
          )
        }
        tools={
          props.options.resizable && (
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                aria-pressed={props.card.wide}
                aria-label={t('wide', { card: props.title })}
                className="aria-pressed:bg-ink-100 aria-pressed:text-ink-950"
                onClick={() => {
                  props.onToggleSize('wide');
                }}
              >
                <MoveHorizontalIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-pressed={props.card.tall}
                aria-label={t('tall', { card: props.title })}
                className="aria-pressed:bg-ink-100 aria-pressed:text-ink-950"
                onClick={() => {
                  props.onToggleSize('tall');
                }}
              >
                <MoveVerticalIcon />
              </Button>
            </div>
          )
        }
      />
    </li>
  );
};

/**
 * A grid of cards to reorder by drag and drop (pointer or keyboard) and resize, with the
 * layout saved in the browser.
 * @returns The grid with its toolbar.
 */
export const DraggableGrid = () => {
  const t = useTranslations('DraggableGrid');
  const switchId = useId();
  const savedJson = useSyncExternalStore(subscribeToSavedLayout, readSavedLayout, () => null);
  const savedLayout = parseStoredLayout(savedJson);
  const [edited, setEdited] = useState<readonly GridCard[] | null>(null);
  const [options, setOptions] = useState<CardOptions>({ draggable: true, resizable: true });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const layout = edited ?? savedLayout ?? BASE_LAYOUT;
  const titleOf = (id: string | number) => {
    const card = layout.find((item) => item.id === String(id));
    return card?.pinned ? t('pinned_title') : t('card_title', { number: String(id) });
  };
  const activeCard = layout.find((card) => card.id === activeId);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setEdited(BASE_LAYOUT);
              setStatus(t('restored_base'));
            }}
          >
            <RotateCcwIcon data-icon="inline-start" />
            {t('restore_base')}
          </Button>
          {savedLayout && (
            <Button
              variant="outline"
              onClick={() => {
                setEdited(savedLayout);
                setStatus(t('restored_saved'));
              }}
            >
              <RotateCcwIcon data-icon="inline-start" />
              {t('restore_saved')}
            </Button>
          )}
          <Button
            onClick={() => {
              setStatus(saveLayout(layout) ? t('saved') : t('save_failed'));
            }}
          >
            <SaveIcon data-icon="inline-start" />
            {t('save')}
          </Button>
          <Button asChild variant="link">
            <a href="https://docs.dndkit.com" target="_blank" rel="noreferrer noopener">
              {t('documentation')}
              <ExternalLinkIcon data-icon="inline-end" />
            </a>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2.5">
            <Switch
              id={`${switchId}-drag`}
              checked={options.draggable}
              onCheckedChange={(draggable) => {
                setOptions({ ...options, draggable });
              }}
            />
            <Label htmlFor={`${switchId}-drag`}>{t('drag_label')}</Label>
          </div>
          <div className="flex items-center gap-2.5">
            <Switch
              id={`${switchId}-resize`}
              checked={options.resizable}
              onCheckedChange={(resizable) => {
                setOptions({ ...options, resizable });
              }}
            />
            <Label htmlFor={`${switchId}-resize`}>{t('resize_label')}</Label>
          </div>
        </div>
      </div>

      <output className="block min-h-5 text-[0.8125rem] text-ink-600">{status}</output>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        accessibility={{
          screenReaderInstructions: { draggable: t('instructions') },
          announcements: {
            onDragStart: (event) => t('announce_start', { card: titleOf(event.active.id) }),
            onDragOver: (event) =>
              event.over
                ? t('announce_over', {
                    card: titleOf(event.active.id),
                    target: titleOf(event.over.id),
                  })
                : t('announce_away', { card: titleOf(event.active.id) }),
            onDragEnd: (event) =>
              event.over
                ? t('announce_drop', {
                    card: titleOf(event.active.id),
                    target: titleOf(event.over.id),
                  })
                : t('announce_drop_nowhere', { card: titleOf(event.active.id) }),
            onDragCancel: (event) => t('announce_cancel', { card: titleOf(event.active.id) }),
          },
        }}
        onDragStart={(event) => {
          setActiveId(String(event.active.id));
          setStatus('');
        }}
        onDragCancel={() => {
          setActiveId(null);
        }}
        onDragEnd={(event) => {
          setActiveId(null);
          if (event.over) {
            setEdited(moveCard(layout, String(event.active.id), String(event.over.id)));
          }
        }}
      >
        <SortableContext items={layout.map((card) => card.id)} strategy={rectSortingStrategy}>
          <ul className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {layout.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                title={titleOf(card.id)}
                options={options}
                onToggleSize={(dimension) => {
                  setEdited(toggleCardSize(layout, card.id, dimension));
                }}
              />
            ))}
          </ul>
        </SortableContext>
        <DragOverlay>
          {activeCard && <CardFace card={activeCard} title={titleOf(activeCard.id)} lifted />}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

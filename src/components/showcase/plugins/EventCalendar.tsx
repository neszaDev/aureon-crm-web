'use client';

import type { CollisionDetection, KeyboardCoordinateGetter } from '@dnd-kit/core';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { cn } from 'cn';
import type { Locale } from 'date-fns';
import {
  addDays,
  format,
  isEqual,
  isSameDay,
  isSameMonth,
  isSameYear,
  parseISO,
  startOfDay,
} from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  XIcon,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { CalendarPeriod, WeekSegment } from './calendarMath';
import {
  CALENDAR_PERIODS,
  layoutWeek,
  moveEventTo,
  shiftPeriod,
  weeksOfPeriod,
} from './calendarMath';
import type { CalendarEvent, EventTone } from './data';
import { buildSampleEvents } from './data';

const DATE_LOCALES: Record<string, Locale> = { en: enUS, fr };

const TONES: Record<EventTone, string> = {
  muted: 'border-ink-300 bg-ink-100 text-ink-900',
  folder: 'border-folder bg-folder text-folder-ink',
  outline: 'border-ink-400 bg-ply text-ink-900',
  ink: 'border-ink-700 bg-ink-700 text-paper-card',
};

const ROW_HEIGHTS: Record<CalendarPeriod, string> = {
  week: 'min-h-72',
  month: 'min-h-28',
  year: 'min-h-20',
};

const dayKey = (day: Date) => format(day, 'yyyy-MM-dd');
const segmentId = (event: CalendarEvent, weekStart: Date) => `${event.id}@${dayKey(weekStart)}`;
const eventIdOf = (id: string | number) => String(id).split('@')[0] ?? '';

const KEY_STEPS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  ArrowUp: -7,
  ArrowDown: 7,
};

// Arrow keys move a picked-up event one day (left/right) or one week (up/down).
const dayCoordinates: KeyboardCoordinateGetter = (event, args) => {
  const step = KEY_STEPS[event.code];
  const { over, droppableRects, collisionRect } = args.context;
  const target =
    step && over && droppableRects.get(dayKey(addDays(parseISO(String(over.id)), step)));
  if (step) {
    event.preventDefault();
  }
  return target && collisionRect
    ? { x: target.left + 4, y: target.top + (target.height - collisionRect.height) / 2 }
    : undefined;
};

// The pointer picks the day; without one (keyboard), the day under the bar's first day.
const dayCollision: CollisionDetection = (args) => {
  if (args.pointerCoordinates) {
    return pointerWithin(args);
  }
  const rect = args.collisionRect;
  return pointerWithin({
    ...args,
    pointerCoordinates: { x: rect.left + 8, y: rect.top + rect.height / 2 },
  });
};

/**
 * One day of a week row: selects the day and receives dropped events.
 * @param props Component props.
 * @param props.day The day.
 * @param props.column Its column in the week (0-6).
 * @param props.outside Whether it is outside the month shown.
 * @param props.today Whether it is today.
 * @param props.selected Whether it is the selected day.
 * @param props.label Accessible name of the day.
 * @param props.dateLocale date-fns locale for the day number.
 * @param props.onSelect Selects the day.
 * @returns The day button.
 */
const DayCell = (props: {
  day: Date;
  column: number;
  outside: boolean;
  today: boolean;
  selected: boolean;
  label: string;
  dateLocale: Locale;
  onSelect: () => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: dayKey(props.day) });

  return (
    <button
      ref={setNodeRef}
      type="button"
      aria-label={props.label}
      aria-pressed={props.selected}
      style={{ gridColumn: props.column + 1, gridRow: '1 / -1' }}
      className={cn(
        'flex flex-col items-start border-r border-b border-ink-200 p-1.5 text-left transition-colors outline-none hover:bg-ink-100/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
        props.outside ? 'bg-paper text-ink-400' : 'bg-paper-card text-ink-700',
        props.selected && 'ring-2 ring-ink-700 ring-inset',
        isOver && 'bg-ink-100',
      )}
      onClick={props.onSelect}
    >
      <time
        dateTime={dayKey(props.day)}
        className={cn(
          'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[0.8125rem] font-semibold',
          props.today && 'bg-folder text-folder-ink',
        )}
      >
        {props.day.getDate() === 1
          ? format(props.day, 'd MMM', { locale: props.dateLocale })
          : props.day.getDate()}
      </time>
    </button>
  );
};

/**
 * The printed face of an event bar, shared by the grid and the drag overlay.
 * @param props Component props.
 * @param props.event The event.
 * @param props.continuesBefore Whether the event started in an earlier week.
 * @param props.continuesAfter Whether the event goes on into a later week.
 * @returns The bar's classes.
 */
const barClasses = (props: {
  event: CalendarEvent;
  continuesBefore?: boolean;
  continuesAfter?: boolean;
}) =>
  cn(
    'flex h-6 w-full min-w-0 items-center truncate rounded-sm border px-1.5 text-left text-xs font-semibold',
    TONES[props.event.tone],
    props.continuesBefore && 'rounded-l-none border-l-0',
    props.continuesAfter && 'rounded-r-none border-r-0',
  );

/**
 * One event's bar in a week row: shows its details on click (or Enter) and can be dragged
 * to another day (pointer, or Space then the arrow keys).
 * @param props Component props.
 * @param props.segment The bar's place in the week.
 * @param props.weekStart First day of the week.
 * @param props.label Accessible name of the event.
 * @param props.selected Whether its details are shown.
 * @param props.onSelect Shows its details.
 * @returns The bar.
 */
const EventBar = (props: {
  segment: WeekSegment;
  weekStart: Date;
  label: string;
  selected: boolean;
  onSelect: () => void;
}) => {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: segmentId(props.segment.event, props.weekStart),
  });

  return (
    <div
      className="relative z-10 min-w-0 px-0.5 py-px"
      style={{
        gridColumn: `${props.segment.column + 1} / span ${props.segment.span}`,
        gridRow: props.segment.lane + 2,
      }}
    >
      <button
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label={props.label}
        aria-pressed={props.selected}
        className={cn(
          barClasses(props.segment),
          'cursor-grab touch-none outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 active:cursor-grabbing',
          props.selected && 'ring-2 ring-ink-950 ring-offset-1',
          isDragging && 'opacity-40',
        )}
        onClick={props.onSelect}
      >
        {props.segment.event.title}
      </button>
    </div>
  );
};

/**
 * A month calendar with events spanning days: previous/next period and year, today, a year,
 * month or week view, day selection, event details and moving events by drag and drop.
 * @param props Component props.
 * @param props.today Today's date (`yyyy-MM-dd`); the sample events are placed around it.
 * @returns The calendar.
 */
export const EventCalendar = (props: { today: string }) => {
  const t = useTranslations('EventCalendar');
  const locale = useLocale();
  const viewId = useId();
  const dateLocale = DATE_LOCALES[locale] ?? enUS;
  const weekStartsOn = dateLocale.options?.weekStartsOn ?? 0;
  const today = parseISO(props.today);

  const [shown, setShown] = useState(today);
  const [period, setPeriod] = useState<CalendarPeriod>('month');
  const [events, setEvents] = useState(() => buildSampleEvents(parseISO(props.today)));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: dayCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const formatDay = (day: Date, pattern = 'PPP') => format(day, pattern, { locale: dateLocale });
  const eventById = (id: string | number) => events.find((event) => event.id === eventIdOf(id));
  const dayOf = (id: string | number) => formatDay(parseISO(String(id)), 'PPPP');
  const describeRange = (event: CalendarEvent) => {
    const sameDay = isSameDay(event.start, event.end);
    const dateOnly =
      event.allDay === true ||
      (isEqual(event.start, startOfDay(event.start)) && isEqual(event.end, startOfDay(event.end)));
    if (dateOnly) {
      return sameDay
        ? formatDay(event.start)
        : t('range', { start: formatDay(event.start), end: formatDay(event.end) });
    }
    return t('range', {
      start: formatDay(event.start, 'PPP p'),
      end: formatDay(event.end, sameDay ? 'p' : 'PPP p'),
    });
  };

  const weeks = weeksOfPeriod(shown, period, weekStartsOn);
  const firstWeek = weeks[0] ?? shown;
  let heading = formatDay(shown, 'LLLL yyyy');
  if (period === 'year') {
    heading = formatDay(shown, 'yyyy');
  } else if (period === 'week') {
    const end = addDays(firstWeek, 6);
    heading = t('range', {
      start: formatDay(firstWeek, isSameYear(firstWeek, end) ? 'd MMM' : 'd MMM yyyy'),
      end: formatDay(end, 'd MMM yyyy'),
    });
  }
  const selectedEvent = events.find((event) => event.id === selectedEventId);
  const activeEvent = activeId ? eventById(activeId) : undefined;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 aria-live="polite" className="text-xl font-bold tracking-[-0.015em] text-ink-950">
          {heading}
        </h3>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('previous_year')}
            onClick={() => {
              setShown(shiftPeriod(shown, 'year', -1));
            }}
          >
            <ChevronsLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t(`previous_${period}`)}
            onClick={() => {
              setShown(shiftPeriod(shown, period, -1));
            }}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShown(today);
            }}
          >
            {t('today')}
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t(`next_${period}`)}
            onClick={() => {
              setShown(shiftPeriod(shown, period, 1));
            }}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label={t('next_year')}
            onClick={() => {
              setShown(shiftPeriod(shown, 'year', 1));
            }}
          >
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={dayCollision}
        accessibility={{
          screenReaderInstructions: { draggable: t('instructions') },
          announcements: {
            onDragStart: (event) =>
              t('announce_start', { title: eventById(event.active.id)?.title ?? '' }),
            onDragOver: (event) =>
              event.over
                ? t('announce_over', {
                    title: eventById(event.active.id)?.title ?? '',
                    date: dayOf(event.over.id),
                  })
                : t('announce_away', { title: eventById(event.active.id)?.title ?? '' }),
            onDragEnd: (event) =>
              event.over
                ? t('moved', {
                    title: eventById(event.active.id)?.title ?? '',
                    date: dayOf(event.over.id),
                  })
                : t('announce_cancel', { title: eventById(event.active.id)?.title ?? '' }),
            onDragCancel: (event) =>
              t('announce_cancel', { title: eventById(event.active.id)?.title ?? '' }),
          },
        }}
        onDragStart={(event) => {
          setActiveId(String(event.active.id));
        }}
        onDragCancel={() => {
          setActiveId(null);
        }}
        onDragEnd={(event) => {
          setActiveId(null);
          const moved = eventById(event.active.id);
          if (!moved || !event.over) {
            return;
          }
          const day = parseISO(String(event.over.id));
          setEvents(events.map((item) => (item.id === moved.id ? moveEventTo(item, day) : item)));
          setMessage(t('moved', { title: moved.title, date: formatDay(day) }));
        }}
      >
        <div
          className={cn(
            'overflow-x-auto rounded-sm border border-ink-300',
            period === 'year' && 'max-h-[63vh] overflow-y-auto',
          )}
        >
          <div className="min-w-[40rem]">
            <div className="sticky top-0 z-20 grid grid-cols-7 border-b-[3px] border-double border-ink-300 bg-paper-card">
              {Array.from({ length: 7 }, (_, index) => addDays(firstWeek, index)).map((day) => (
                <div
                  key={day.getDay()}
                  className="form-label border-r border-ink-200 px-2 py-2 last:border-r-0"
                >
                  {formatDay(day, 'EEE')}
                </div>
              ))}
            </div>
            {weeks.map((weekStart) => {
              const week = layoutWeek(weekStart, events);
              return (
                <div
                  key={dayKey(weekStart)}
                  data-testid={`week-${dayKey(weekStart)}`}
                  className={cn(
                    'grid grid-cols-7 [&>button:nth-child(7)]:border-r-0',
                    ROW_HEIGHTS[period],
                  )}
                  style={{ gridTemplateRows: `2.25rem repeat(${week.laneCount}, 1.625rem) 1fr` }}
                >
                  {Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)).map(
                    (day, column) => {
                      const count = week.segments.filter(
                        (segment) =>
                          column >= segment.column && column < segment.column + segment.span,
                      ).length;
                      return (
                        <DayCell
                          key={dayKey(day)}
                          day={day}
                          column={column}
                          outside={period === 'month' && !isSameMonth(day, shown)}
                          today={isSameDay(day, today)}
                          selected={selectedDay !== null && isSameDay(day, selectedDay)}
                          label={t('day_label', { date: formatDay(day, 'PPPP'), count })}
                          dateLocale={dateLocale}
                          onSelect={() => {
                            setSelectedDay(day);
                            setMessage(t('clicked_day', { date: formatDay(day) }));
                          }}
                        />
                      );
                    },
                  )}
                  {week.segments.map((segment) => (
                    <EventBar
                      key={segmentId(segment.event, weekStart)}
                      segment={segment}
                      weekStart={weekStart}
                      label={t('event_label', {
                        title: segment.event.title,
                        when: describeRange(segment.event),
                      })}
                      selected={segment.event.id === selectedEventId}
                      onSelect={() => {
                        setSelectedEventId(segment.event.id);
                        setMessage(t('clicked_event', { title: segment.event.title }));
                      }}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        <DragOverlay>
          {activeEvent && (
            <div className={cn(barClasses({ event: activeEvent }), 'shadow-paper')}>
              {activeEvent.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedEvent && (
        <section
          aria-labelledby={`${viewId}-event`}
          className="flex flex-col gap-3 rounded-sm border border-ink-200 bg-ply p-4 shadow-ply"
        >
          <div className="flex items-start justify-between gap-3">
            <h4 id={`${viewId}-event`} className="font-semibold text-ink-950">
              {selectedEvent.title}
            </h4>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t('close_details')}
              onClick={() => {
                setSelectedEventId(null);
              }}
            >
              <XIcon />
            </Button>
          </div>
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
            <dt className="form-label sm:pt-0.5">{t('when')}</dt>
            <dd className="text-[0.9375rem] text-ink-900">{describeRange(selectedEvent)}</dd>
            <dt className="form-label sm:pt-0.5">{t('description')}</dt>
            <dd className="text-[0.9375rem] text-ink-900">
              {selectedEvent.description ?? t('no_description')}
            </dd>
          </dl>
        </section>
      )}

      <div className="flex flex-col gap-3 border-t border-ink-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Label htmlFor={`${viewId}-view`}>{t('view')}</Label>
          <NativeSelect
            id={`${viewId}-view`}
            size="sm"
            className="w-32"
            value={period}
            onChange={(event) => {
              const next = CALENDAR_PERIODS.find((item) => item === event.target.value);
              if (next) {
                setPeriod(next);
              }
            }}
          >
            {CALENDAR_PERIODS.map((item) => (
              <NativeSelectOption key={item} value={item}>
                {t(`period_${item}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <output className="block min-h-5 text-[0.9375rem] font-semibold text-ink-950">
          {message}
        </output>
      </div>
    </div>
  );
};

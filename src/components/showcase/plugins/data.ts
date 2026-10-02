// Sample data for the plugin demos: the draggable grid's base layout and the calendar's events.

/** Accent stripe on a grid card, one step of the folder/ink palette. */
export type CardAccent = 'folder' | 'ink-950' | 'ink-700' | 'ink-600' | 'ink-400' | 'ink-300';

/** One card of the draggable grid, in display order. */
export type GridCard = {
  id: string;
  accent: CardAccent;
  /** Spans two columns from `sm` up. */
  wide: boolean;
  /** Taller than the other cards. */
  tall: boolean;
  /** Pinned: cannot be dragged, and the other cards move around it. */
  pinned: boolean;
};

// The Vue demo's base layout (12-column grid): widths 4 or 8, heights 12 or 16.
export const BASE_LAYOUT: readonly GridCard[] = [
  { id: '1', accent: 'folder', wide: false, tall: true, pinned: false },
  { id: '2', accent: 'ink-300', wide: false, tall: false, pinned: true },
  { id: '3', accent: 'ink-950', wide: false, tall: false, pinned: false },
  { id: '4', accent: 'ink-700', wide: false, tall: false, pinned: false },
  { id: '5', accent: 'ink-600', wide: true, tall: false, pinned: false },
  { id: '6', accent: 'ink-400', wide: false, tall: false, pinned: false },
];

/** Fill of an event bar, one of the folder/ink tones. */
export type EventTone = 'muted' | 'folder' | 'outline' | 'ink';

/** One calendar entry. Dates are local wall-clock times; `end` is inclusive. */
export type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  description?: string;
  tone: EventTone;
};

/**
 * The Vue demo's sample events, placed relative to the month of `today`.
 * @param today The day the calendar opens on.
 * @returns The events, sorted as the Vue demo lists them.
 */
export const buildSampleEvents = (today: Date): CalendarEvent[] => {
  const year = today.getFullYear();
  const month = today.getMonth();
  const at = (day: number, hours = 0, minutes = 0) => new Date(year, month, day, hours, minutes);

  return [
    {
      id: 'all-day',
      title: 'All-day event with a very long title',
      allDay: true,
      start: at(0),
      end: at(1),
      tone: 'muted',
    },
    { id: 'long', title: 'Long event', start: at(7), end: at(10), tone: 'muted' },
    {
      id: 'dst-starts',
      title: 'Daylight saving starts',
      start: new Date(year + 1, 2, 13),
      end: new Date(year + 1, 2, 20),
      tone: 'muted',
    },
    {
      id: 'dst-ends',
      title: 'Daylight saving ends',
      start: new Date(year + 1, 10, 6),
      end: new Date(year + 1, 10, 13),
      tone: 'muted',
    },
    { id: 'some', title: 'Some event', start: at(9), end: at(9), tone: 'muted' },
    {
      id: 'conference',
      title: 'Conference',
      start: at(11),
      end: at(13),
      description: 'Big conference for important people',
      tone: 'outline',
    },
    {
      id: 'meeting-1',
      title: 'Meeting',
      start: at(12, 10, 30),
      end: at(12, 12, 30),
      description: 'Pre-meeting meeting, to prepare for the meeting',
      tone: 'muted',
    },
    {
      id: 'lunch',
      title: 'Lunch',
      start: at(12, 12),
      end: at(12, 13),
      description: 'Power lunch',
      tone: 'muted',
    },
    { id: 'meeting-2', title: 'Meeting', start: at(14, 14), end: at(14, 15), tone: 'muted' },
    {
      id: 'happy-hour',
      title: 'Happy hour',
      start: at(12, 17),
      end: at(12, 17, 30),
      description: 'Most important meal of the day',
      tone: 'folder',
    },
    { id: 'dinner', title: 'Dinner', start: at(26, 20), end: at(26, 21), tone: 'ink' },
    {
      id: 'birthday-1',
      title: 'Birthday party',
      start: at(13, 7),
      end: at(13, 10, 30),
      tone: 'muted',
    },
    {
      id: 'birthday-2',
      title: 'Birthday party 2',
      start: at(24, 17),
      end: at(24, 18, 30),
      tone: 'folder',
    },
    {
      id: 'late-night',
      title: 'Late night event',
      start: at(17, 19, 30),
      end: at(18, 2),
      tone: 'ink',
    },
    {
      id: 'multi-day',
      title: 'Multi-day event',
      start: at(20, 19, 30),
      end: at(22, 2),
      tone: 'muted',
    },
  ];
};

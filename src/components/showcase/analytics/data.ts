import type { Brand } from '@/components/showcase/widgets/BrandIcon';
import type { Tone } from '@/components/showcase/widgets/tones';

export type Period = 'day' | 'month' | 'year';

/** The traffic chart's periods, in toggle order. */
export const PERIODS: readonly Period[] = ['day', 'month', 'year'];

const POINTS: Record<Period, number> = { day: 24, month: 28, year: 12 };
const SEEDS: Record<Period, number> = { day: 24, month: 28, year: 2017 };

/** The dashed target line of the traffic chart. */
export const TRAFFIC_TARGET = 65;

/** The traffic chart's y-axis ceiling. */
export const TRAFFIC_MAX = 250;

/**
 * A small seeded generator (Park-Miller), so the "random" demo series is the same on the
 * server and the client.
 * @param seed Any positive integer.
 * @returns A function returning the next number in [0, 1).
 */
const seeded = (seed: number) => {
  const modulus = 2_147_483_647;
  let state = seed % modulus || 1;
  return () => {
    state = (state * 16_807) % modulus;
    return (state - 1) / (modulus - 1);
  };
};

export type TrafficPoint = { index: number; visits: number; unique: number };

/**
 * The traffic chart's two series for a period (`MainChartExample.vue`): visits between 50 and
 * 200 and unique visitors between 80 and 100, deterministic per period.
 * @param period Day (24 hours), month (28 days) or year (12 months).
 * @returns One point per hour, day or month.
 */
export const trafficSeries = (period: Period): TrafficPoint[] => {
  const random = seeded(SEEDS[period]);
  const between = (min: number, max: number) => Math.floor(random() * (max - min + 1) + min);

  return Array.from({ length: POINTS[period] }, (_, index) => ({
    index,
    visits: between(50, 200),
    unique: between(80, 100),
  }));
};

/**
 * Quotes a CSV field when it holds a comma, a quote or a line break.
 * @param field The raw value.
 * @returns The field, safe to join with commas.
 */
const csvField = (field: string | number) => {
  const text = String(field);
  return /[",\n\r]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/**
 * The traffic series as CSV, for the chart's download button.
 * @param header Column titles: the x label, visits, unique visitors, target.
 * @param rows One row per point: its label, then the values.
 * @returns CSV text with a header row and CRLF line ends.
 */
export const trafficCsv = (
  header: readonly [string, string, string, string],
  rows: readonly (readonly [string, number, number, number])[],
) => [header, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n');

/** The traffic card's footer figures, left to right. */
export const TRAFFIC_TOTALS = [
  { id: 'visits', count: 29_703, percent: 40, tone: 'pass' },
  { id: 'unique', count: 24_093, percent: 20, tone: 'ink' },
  { id: 'pageviews', count: 78_706, percent: 60, tone: 'slate' },
  { id: 'new_users', count: 22_123, percent: 80, tone: 'pencil' },
  { id: 'bounce_rate', count: 0, percent: 40.15, tone: 'folder' },
] as const satisfies readonly { id: string; count: number; percent: number; tone: Tone }[];

/** New and recurring clients per weekday (percentages), Monday first. */
export const CLIENTS_BY_DAY = [
  { fresh: 34, recurring: 78 },
  { fresh: 56, recurring: 94 },
  { fresh: 12, recurring: 67 },
  { fresh: 43, recurring: 91 },
  { fresh: 22, recurring: 73 },
  { fresh: 53, recurring: 82 },
  { fresh: 9, recurring: 69 },
] as const;

/** The callout figures of the traffic and sales card. */
export const SALES_CALLOUTS = {
  newClients: 9123,
  recurringClients: 22_643,
  pageviews: 78_623,
  organic: 49_123,
} as const;

/** Visitors by gender, in percent. */
export const GENDER_SPLIT = { male: 43, female: 37 } as const;

/** Visits by source: a count and its share in percent. */
export const SOURCES = [
  { id: 'organic', brand: null, count: 191_235, percent: 56 },
  { id: 'facebook', brand: 'facebook', count: 51_223, percent: 15 },
  { id: 'twitter', brand: 'twitter', count: 37_564, percent: 11 },
  { id: 'linkedin', brand: 'linkedin', count: 27_319, percent: 8 },
] as const satisfies readonly { id: string; brand: Brand | null; count: number; percent: number }[];

export type Presence = 'online' | 'busy' | 'away' | 'offline';

/** The moment the sample activity is measured from, fixed so the page renders the same everywhere. */
export const ACTIVITY_NOW = new Date('2026-10-02T09:00:00Z');

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

type User = {
  id: number;
  name: string;
  avatar: string;
  presence: Presence;
  isNew: boolean;
  registered: string;
  country: string;
  usage: number;
  usageFrom: string;
  usageTo: string;
  payment: { brand: Brand; name: string };
  lastSeenSecondsAgo: number;
};

/** The users table of the dashboard: sample people, like rows from an API. */
export const USERS: readonly User[] = [
  {
    id: 1,
    name: 'Yiorgos Avraamu',
    avatar: '/assets/images/avatars/1.jpg',
    presence: 'online',
    isNew: true,
    registered: '2026-01-01',
    country: 'US',
    usage: 50,
    usageFrom: '2026-08-11',
    usageTo: '2026-09-10',
    payment: { brand: 'mastercard', name: 'Mastercard' },
    lastSeenSecondsAgo: 10,
  },
  {
    id: 2,
    name: 'Avram Tarasios',
    avatar: '/assets/images/avatars/2.jpg',
    presence: 'busy',
    isNew: false,
    registered: '2026-01-01',
    country: 'BR',
    usage: 22,
    usageFrom: '2026-08-11',
    usageTo: '2026-09-10',
    payment: { brand: 'visa', name: 'Visa' },
    lastSeenSecondsAgo: 5 * MINUTE,
  },
  {
    id: 3,
    name: 'Quintin Ed',
    avatar: '/assets/images/avatars/3.jpg',
    presence: 'away',
    isNew: true,
    registered: '2026-01-01',
    country: 'IN',
    usage: 74,
    usageFrom: '2026-08-11',
    usageTo: '2026-09-10',
    payment: { brand: 'stripe', name: 'Stripe' },
    lastSeenSecondsAgo: HOUR,
  },
  {
    id: 4,
    name: 'Enéas Kwadwo',
    avatar: '/assets/images/avatars/4.jpg',
    presence: 'offline',
    isNew: true,
    registered: '2026-01-01',
    country: 'FR',
    usage: 98,
    usageFrom: '2026-08-11',
    usageTo: '2026-09-10',
    payment: { brand: 'paypal', name: 'PayPal' },
    lastSeenSecondsAgo: 31 * DAY,
  },
  {
    id: 5,
    name: 'Agapetus Tadeáš',
    avatar: '/assets/images/avatars/5.jpg',
    presence: 'online',
    isNew: true,
    registered: '2026-01-01',
    country: 'ES',
    usage: 22,
    usageFrom: '2026-08-11',
    usageTo: '2026-09-10',
    payment: { brand: 'googlePay', name: 'Google Pay' },
    lastSeenSecondsAgo: 7 * DAY,
  },
  {
    id: 6,
    name: 'Friderik Dávid',
    avatar: '/assets/images/avatars/6.jpg',
    presence: 'busy',
    isNew: true,
    registered: '2026-01-01',
    country: 'PL',
    usage: 43,
    usageFrom: '2026-08-11',
    usageTo: '2026-09-10',
    payment: { brand: 'amex', name: 'American Express' },
    lastSeenSecondsAgo: 7 * DAY,
  },
];

/**
 * The bar colour for a usage share, by quarter (info, success, warning, danger in Vue).
 * @param value Usage in percent.
 * @returns The tone for the bar.
 */
export const usageTone = (value: number): Tone => {
  if (value <= 25) {
    return 'ink';
  }
  if (value <= 50) {
    return 'pass';
  }
  if (value <= 75) {
    return 'slate';
  }
  return 'pencil';
};

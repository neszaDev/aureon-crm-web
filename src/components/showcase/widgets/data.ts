import type { Brand } from './BrandIcon';
import type { Tone } from './tones';

/** The default series of the CoreUI simple charts, one value per month. */
export const SALES_POINTS = [10, 22, 34, 46, 58, 70, 46, 23, 45, 78, 34, 12] as const;

type DropdownWidget = {
  id: string;
  tone: Tone;
  value: number;
  icon: 'settings' | 'pin';
  chart:
    | {
        kind: 'line';
        points: readonly number[];
        pointed?: boolean;
        linear?: boolean;
        area?: boolean;
      }
    | { kind: 'bar'; points: readonly number[] };
};

/** The four filled widgets with a menu and a sparkline (`WidgetsDropdown.vue`). */
export const DROPDOWN_WIDGETS: readonly DropdownWidget[] = [
  {
    id: 'members-folder',
    tone: 'folder',
    value: 9823,
    icon: 'settings',
    chart: { kind: 'line', points: [65, 59, 84, 84, 51, 55, 40], pointed: true },
  },
  {
    id: 'members-ink',
    tone: 'ink',
    value: 9823,
    icon: 'pin',
    chart: { kind: 'line', points: [1, 18, 9, 17, 34, 22, 11], pointed: true, linear: true },
  },
  {
    id: 'members-slate',
    tone: 'slate',
    value: 9823,
    icon: 'settings',
    chart: { kind: 'line', points: [78, 81, 80, 45, 34, 12, 40], area: true },
  },
  {
    id: 'members-pencil',
    tone: 'pencil',
    value: 9823,
    icon: 'settings',
    chart: { kind: 'bar', points: SALES_POINTS },
  },
];

type Figure = { value: number; compact?: boolean; atLeast?: boolean };

type BrandWidget = {
  id: string;
  icon: Extract<Brand, 'facebook' | 'twitter' | 'linkedin'> | 'calendar';
  tone: Tone;
  points: readonly number[];
  left: Figure & { label: 'friends' | 'followers' | 'contacts' | 'events' };
  right: Figure & { label: 'feeds' | 'tweets' | 'meetings' };
};

/** The social widgets (`WidgetsBrand.vue`): a logo band, a sparkline and two figures. */
export const BRAND_WIDGETS: readonly BrandWidget[] = [
  {
    id: 'facebook',
    icon: 'facebook',
    tone: 'ink',
    points: [65, 59, 84, 84, 51, 55, 40],
    left: { value: 89_000, compact: true, label: 'friends' },
    right: { value: 459, label: 'feeds' },
  },
  {
    id: 'twitter',
    icon: 'twitter',
    tone: 'slate',
    points: [1, 13, 9, 17, 34, 41, 38],
    left: { value: 973_000, compact: true, label: 'followers' },
    right: { value: 1792, label: 'tweets' },
  },
  {
    id: 'linkedin',
    icon: 'linkedin',
    tone: 'folder',
    points: [78, 81, 80, 45, 34, 12, 40],
    left: { value: 500, atLeast: true, label: 'contacts' },
    right: { value: 292, label: 'feeds' },
  },
  {
    id: 'calendar',
    icon: 'calendar',
    tone: 'pencil',
    points: [35, 23, 56, 22, 97, 23, 64],
    left: { value: 12, label: 'events' },
    right: { value: 4, label: 'meetings' },
  },
];

/** The four tones the progress, icon and simple widget rows walk through, in Vue order. */
export const ROW_TONES: readonly Tone[] = ['pass', 'ink', 'slate', 'pencil'];

/** The tones of the icon widgets (primary, info, warning, danger in Vue). */
export const ICON_TONES: readonly Tone[] = ['folder', 'ink', 'slate', 'pencil'];

type ProgressIconWidget = {
  id: 'visitors' | 'new_clients' | 'products_sold' | 'returning' | 'avg_time' | 'comments';
  tone: Tone;
};

/** The progress-icon widgets (`CWidgetProgressIcon`), in Vue order; the sixth only shows in grids. */
export const PROGRESS_ICON_WIDGETS: readonly ProgressIconWidget[] = [
  { id: 'visitors', tone: 'ink' },
  { id: 'new_clients', tone: 'pass' },
  { id: 'products_sold', tone: 'slate' },
  { id: 'returning', tone: 'folder' },
  { id: 'avg_time', tone: 'pencil' },
  { id: 'comments', tone: 'ink' },
];

type SimpleWidget = {
  id: 'sessions' | 'sign_ups' | 'downloads' | 'orders' | 'refunds' | 'reviews';
  value: number;
  kind: 'line' | 'bar';
  tone: Tone;
};

/** The simple widgets with a small chart (`CWidgetSimple`). */
export const SIMPLE_WIDGETS: readonly SimpleWidget[] = [
  { id: 'sessions', value: 1123, kind: 'line', tone: 'pencil' },
  { id: 'sign_ups', value: 1123, kind: 'line', tone: 'folder' },
  { id: 'downloads', value: 1123, kind: 'line', tone: 'pass' },
  { id: 'orders', value: 1123, kind: 'bar', tone: 'pencil' },
  { id: 'refunds', value: 1123, kind: 'bar', tone: 'folder' },
  { id: 'reviews', value: 1123, kind: 'bar', tone: 'pass' },
];

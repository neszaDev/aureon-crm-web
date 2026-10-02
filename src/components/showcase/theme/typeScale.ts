/**
 * The Marksheet type scale (DESIGN.md → Typography) as the utility classes each role is set
 * with in the app, for the typography page.
 */

type TypeStyle = {
  /** The role's name in DESIGN.md (and its translation key). */
  key: string;
  /** The element the role is set on in the app. */
  tag: string;
  /** The classes, exactly as the app uses them. */
  className: string;
  /** Size, weight, leading and tracking, as written in DESIGN.md. */
  spec: string;
};

export const HEADING_STYLES = [
  {
    key: 'headline',
    tag: 'h2',
    className: 'text-[1.875rem] leading-[1.11] font-bold tracking-[-0.025em] sm:text-[2.25rem]',
    spec: '700 · 1.875–2.25rem · -0.025em',
  },
  {
    key: 'page_title',
    tag: 'h1',
    className: 'text-[1.75rem] leading-tight font-bold tracking-[-0.02em] sm:text-[2rem]',
    spec: '700 · 1.75–2rem · 1.25 · -0.02em',
  },
  {
    key: 'title',
    tag: 'h2',
    className: 'text-lg leading-snug font-semibold tracking-[-0.01em]',
    spec: '600 · 1.125rem · 1.375 · -0.01em',
  },
] as const satisfies readonly TypeStyle[];

export const DISPLAY_STYLES = [
  {
    key: 'display',
    tag: 'h1',
    className:
      'text-[clamp(2.75rem,6vw,4.25rem)] leading-[1.02] font-extrabold tracking-[-0.035em]',
    spec: '800 · 2.75–4.25rem · 1.02 · -0.035em',
  },
  {
    key: 'display_small',
    tag: 'h2',
    className: 'text-[1.875rem] leading-[1.05] font-extrabold tracking-[-0.03em] sm:text-[3rem]',
    spec: '800 · 1.875–3rem',
  },
  {
    key: 'figure',
    tag: 'p',
    className: 'text-[1.875rem] leading-[1.2] font-semibold tracking-[-0.025em] tabular-nums',
    spec: '600 · 1.875rem · 1.2 · -0.025em · tnum',
  },
] as const satisfies readonly TypeStyle[];

export const TEXT_STYLES = [
  { key: 'lead', tag: 'p', className: 'text-lg leading-relaxed', spec: '400 · 1.125rem · 1.625' },
  {
    key: 'body',
    tag: 'p',
    className: 'text-[0.9375rem] leading-normal',
    spec: '400 · 0.9375rem · 1.5',
  },
  { key: 'hint', tag: 'p', className: 'text-[0.8125rem] text-ink-600', spec: '400 · 0.8125rem' },
  { key: 'table', tag: 'td', className: 'text-sm tabular-nums', spec: '400 · 0.875rem · tnum' },
  { key: 'label', tag: 'label', className: 'form-label', spec: '600 · 0.6875rem · 0.12em · caps' },
  {
    key: 'hand_remark',
    tag: 'p',
    className: 'font-hand text-[1.375rem] leading-snug text-ink-700',
    spec: 'Kalam 400 · 1.25–1.375rem · 1.375',
  },
  {
    key: 'hand_note',
    tag: 'p',
    className: 'font-hand text-[0.9375rem] leading-snug text-ink-600',
    spec: 'Kalam 400 · 0.9375rem',
  },
] as const satisfies readonly TypeStyle[];

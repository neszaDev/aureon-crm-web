/**
 * The Marksheet button variants that sit on card stock, in the order the showcase lists them.
 * They stand in for the Bootstrap colour set (primary, secondary, success, ...) of the Vue app.
 */
export const CARD_VARIANTS = [
  'default',
  'outline',
  'secondary',
  'ghost',
  'destructive',
  'link',
] as const;

export type CardVariant = (typeof CARD_VARIANTS)[number];

/** The variants that read as a filled or bordered control (link has no box). */
export const BOXED_VARIANTS = ['default', 'outline', 'secondary', 'ghost', 'destructive'] as const;

/**
 * How each variant looks while pressed (`aria-pressed="true"`): its hover state, held.
 * The destructive literal is the same deeper red pen as the button's own hover.
 */
export const PRESSED_CLASS: Record<CardVariant, string> = {
  default: 'bg-folder-deep',
  outline: 'border-ink-400 bg-paper-card',
  secondary: 'bg-ink-200',
  ghost: 'bg-ink-100 text-ink-900',
  destructive: 'bg-[#a82621]',
  link: 'underline',
};

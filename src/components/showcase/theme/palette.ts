/**
 * The Marksheet palette as data, for the colours page. The values mirror `:root` in
 * `src/styles/global.css` (a test keeps them in step); `pair` is the colour each one is read
 * against, for the contrast figure.
 */

export type Swatch = {
  /** CSS custom property name, without the leading `--`. */
  token: string;
  hex: string;
  pair: string;
};

export const THEME_COLORS = [
  { token: 'folder', hex: '#1f5c45', pair: 'folder-ink' },
  { token: 'folder-deep', hex: '#164433', pair: 'folder-ink' },
  { token: 'folder-ink', hex: '#f1f5ef', pair: 'folder' },
  { token: 'folder-ink-soft', hex: '#bcd3c5', pair: 'folder' },
  { token: 'pass', hex: '#1f6b4e', pair: 'paper-card' },
  { token: 'pen', hex: '#c42f2a', pair: 'paper-card' },
  { token: 'pencil', hex: '#5f666e', pair: 'paper-card' },
  { token: 'paper', hex: '#e8eee6', pair: 'ink-900' },
  { token: 'paper-card', hex: '#f5f8f3', pair: 'ink-900' },
  { token: 'ply', hex: '#ffffff', pair: 'ink-900' },
] as const satisfies readonly Swatch[];

export const INK_RAMP = [
  { token: 'ink-950', hex: '#111b30', pair: 'paper-card' },
  { token: 'ink-900', hex: '#1b2b4b', pair: 'paper-card' },
  { token: 'ink-700', hex: '#33436a', pair: 'paper-card' },
  { token: 'ink-600', hex: '#4a5878', pair: 'paper-card' },
  { token: 'ink-400', hex: '#8a94a9', pair: 'ply' },
  { token: 'ink-300', hex: '#b3bccb', pair: 'paper-card' },
  { token: 'ink-200', hex: '#cfd7de', pair: 'paper-card' },
  { token: 'ink-100', hex: '#dfe5e6', pair: 'ink-900' },
] as const satisfies readonly Swatch[];

const ALL: readonly Swatch[] = [...THEME_COLORS, ...INK_RAMP];

/**
 * Looks up a palette colour's hex value.
 * @param token The token name.
 * @returns The hex value, or `undefined` for an unknown token.
 */
export const hexOf = (token: string) => ALL.find((swatch) => swatch.token === token)?.hex;

/**
 * Splits a `#rrggbb` colour into its channels.
 * @param hex The colour.
 * @returns Red, green and blue, 0-255.
 */
export const toRgb = (hex: string) =>
  [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));

const luminance = (hex: string) => {
  const [r, g, b] = toRgb(hex).map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
};

/**
 * The WCAG 2 contrast ratio between two colours.
 * @param first A `#rrggbb` colour.
 * @param second Another `#rrggbb` colour.
 * @returns The ratio, from 1 (none) to 21 (black on white).
 */
export const contrastRatio = (first: string, second: string) => {
  const [light, dark] = [luminance(first), luminance(second)].toSorted((a, b) => b - a);
  return ((light ?? 0) + 0.05) / ((dark ?? 0) + 0.05);
};

/**
 * The WCAG level a contrast ratio reaches.
 * @param ratio The contrast ratio.
 * @returns `aaa` (7:1), `aa` (4.5:1, body text), `large` (3:1, large text and controls) or
 *   `decorative` (rules and fills only).
 */
export const contrastLevel = (ratio: number) => {
  if (ratio >= 7) {
    return 'aaa';
  }
  if (ratio >= 4.5) {
    return 'aa';
  }
  return ratio >= 3 ? 'large' : 'decorative';
};

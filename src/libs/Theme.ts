/** Cookie holding the chosen colour theme; the root layout reads it to set the class on `<html>`. */
export const THEME_COOKIE = 'theme';

/** The colour themes a user can pick; `system` follows `prefers-color-scheme`. */
export const THEMES = ['light', 'dark', 'system'] as const;

export type Theme = (typeof THEMES)[number];

/**
 * Reads a theme from untrusted input (a cookie or a form value).
 * @param value The raw value.
 * @returns `light` or `dark` when the value is exactly that, otherwise `system`.
 */
export const parseTheme = (value?: unknown): Theme =>
  value === 'light' || value === 'dark' ? value : 'system';

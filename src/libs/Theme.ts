/**
 * Cookie holding the chosen colour theme. Not httpOnly: `THEME_SCRIPT` reads it in the browser,
 * so the root layout stays static.
 */
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

// Only `light` or `dark` can match, so a crafted cookie can't put anything else on <html>.
const THEME_COOKIE_PATTERN = /(?:^|; )theme=(light|dark)(?:;|$)/u;

/**
 * Inline script for `<head>`: puts the theme cookie's class on `<html>` before the first paint.
 * Without the cookie (or with `system`) it adds nothing and the OS preference applies.
 */
export const THEME_SCRIPT = `try{var m=document.cookie.match(${String(THEME_COOKIE_PATTERN)});if(m)document.documentElement.classList.add(m[1])}catch(e){}`;

/**
 * Reads the theme from a `document.cookie` string, as `THEME_SCRIPT` does.
 * @param cookie The cookie header.
 * @returns The stored theme, or `system` without one.
 */
export const themeFromCookie = (cookie: string) =>
  parseTheme(THEME_COOKIE_PATTERN.exec(cookie)?.[1]);

/**
 * Puts the theme's class on `<html>`: `light` or `dark`, none for `system`. Browser only.
 * @param theme The theme to show.
 */
export const applyTheme = (theme: Theme) => {
  const classes = document.documentElement.classList;
  classes.remove('light', 'dark');
  if (theme !== 'system') {
    classes.add(theme);
  }
};

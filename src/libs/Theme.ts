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

/** Each theme's canvas (`--ground`): the browser's bar colour too (`themeColor`). */
export const THEME_GROUNDS = { light: '#ffffff', dark: '#17151f' } as const;

/**
 * Puts the theme's class on `<html>`: `light` or `dark`, none for `system`; and tints the
 * browser's bar with that theme's ground (the layout's `theme-color` tags, one per OS scheme,
 * would follow the OS). Browser only.
 * @param theme The theme to show.
 */
export const applyTheme = (theme: Theme) => {
  const classes = document.documentElement.classList;
  classes.remove('light', 'dark');
  if (theme !== 'system') {
    classes.add(theme);
  }
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const scheme = meta.media.includes('dark') ? 'dark' : 'light';
    meta.content = THEME_GROUNDS[theme === 'system' ? scheme : theme];
  }
};

/**
 * Shows a chosen theme and remembers it for a year, without a server round trip: the class on
 * `<html>` now, the theme cookie for `THEME_SCRIPT` on the next load. Browser only.
 * @param theme The chosen theme.
 */
export const chooseTheme = (theme: Theme) => {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  // The Cookie Store API is async and needs a secure context; THEME_SCRIPT reads this one back.
  // oxlint-disable-next-line unicorn/no-document-cookie -- see above
  document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
  applyTheme(theme);
};

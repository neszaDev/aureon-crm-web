import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { chooseTheme, parseTheme, THEME_SCRIPT, themeFromCookie } from './Theme';

/**
 * Runs the inline theme script against a fake document.
 * @param cookie The document's cookie string.
 * @returns The classes the script added to `<html>`.
 */
const runThemeScript = (cookie: string) => {
  const added: string[] = [];
  const document = {
    cookie,
    documentElement: { classList: { add: (name: string) => added.push(name) } },
  };
  runInNewContext(THEME_SCRIPT, { document });

  return added;
};

describe(parseTheme, () => {
  it('keeps the light and dark themes', () => {
    expect(parseTheme('light')).toBe('light');
    expect(parseTheme('dark')).toBe('dark');
  });

  it('falls back to the system theme for anything else', () => {
    expect(parseTheme('x')).toBe('system');
    expect(parseTheme()).toBe('system');
    expect(parseTheme('system')).toBe('system');
  });
});

describe(THEME_SCRIPT, () => {
  it('adds the class of a light or dark theme cookie', () => {
    expect(runThemeScript('theme=dark')).toStrictEqual(['dark']);
    expect(runThemeScript('NEXT_LOCALE=th; theme=light; access_token=x')).toStrictEqual(['light']);
  });

  it('adds nothing for the system theme, no cookie or any other value', () => {
    for (const cookie of [
      '',
      'theme=system',
      'theme=darkish',
      'theme=dark%22%20onload%3D',
      'theme="dark"',
      'xtheme=dark',
      'theme=<img src=x onerror=alert(1)>',
    ]) {
      expect(runThemeScript(cookie)).toStrictEqual([]);
    }
  });
});

describe(themeFromCookie, () => {
  it('reads the theme the same way as the inline script', () => {
    expect(themeFromCookie('a=1; theme=dark')).toBe('dark');
    expect(themeFromCookie('theme=darkish')).toBe('system');
    expect(themeFromCookie('')).toBe('system');
  });
});

/**
 * Chooses the dark theme on a fake page.
 * @param protocol The page's protocol.
 * @returns The cookie string it wrote.
 */
const chooseDarkOn = (protocol: string) => {
  const document = {
    cookie: '',
    documentElement: { classList: { add: () => {}, remove: () => {} } },
    querySelectorAll: () => [],
  };
  vi.stubGlobal('window', { location: { protocol } });
  vi.stubGlobal('document', document);
  chooseTheme('dark');
  vi.unstubAllGlobals();

  return document.cookie;
};

describe(chooseTheme, () => {
  it('remembers the theme for a year, Secure on https only', () => {
    expect(chooseDarkOn('https:')).toBe(
      'theme=dark; path=/; max-age=31536000; SameSite=Lax; Secure',
    );
    expect(chooseDarkOn('http:')).toBe('theme=dark; path=/; max-age=31536000; SameSite=Lax');
  });
});

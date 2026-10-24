'use client';

import { useLayoutEffect } from 'react';
import { applyTheme, themeFromCookie } from '@/libs/Theme';

/**
 * Re-applies the theme cookie's class on `<html>` before paint. In development, React's Strict
 * Mode remount resets `<html>` to its JSX attributes and drops the class `THEME_SCRIPT` set; in
 * production the class is already there and this changes nothing.
 * @returns Nothing.
 */
export const ThemeClass = () => {
  useLayoutEffect(() => {
    applyTheme(themeFromCookie(document.cookie));
  }, []);

  return null;
};

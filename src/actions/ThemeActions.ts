'use server';

import { cookies } from 'next/headers';
import { isSecureAppUrl } from '@/libs/Auth';
import { Env } from '@/libs/Env';
import { parseTheme, THEME_COOKIE } from '@/libs/Theme';

/**
 * Stores the colour theme for a year; the inline theme script applies it on the next full load.
 * The ThemeSwitcher sets the class on `<html>` itself, so this is only persistence.
 * @param theme The chosen theme; anything unknown is stored as `system`.
 */
export async function setTheme(theme: string) {
  const jar = await cookies();
  jar.set({
    name: THEME_COOKIE,
    value: parseTheme(theme),
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    // Not a secret: the inline theme script reads it before the first paint.
    httpOnly: false,
    secure: isSecureAppUrl(Env.APP_URL),
  });
}

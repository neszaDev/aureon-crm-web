'use server';

import { cookies } from 'next/headers';
import { isSecureAppUrl } from '@/libs/Auth';
import { Env } from '@/libs/Env';
import { parseTheme, THEME_COOKIE } from '@/libs/Theme';

/**
 * Stores the colour theme for a year. Setting the cookie re-renders the page, so the root layout
 * applies the new theme class in the same round trip.
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
    httpOnly: true,
    secure: isSecureAppUrl(Env.APP_URL),
  });
}

import 'server-only';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/libs/I18nNavigation';

/**
 * Sends the user to sign in when the backend no longer accepts the session.
 * @param status HTTP status of the backend response.
 */
export const redirectIfUnauthorized = async (status: number) => {
  if (status === 401) {
    redirect({ href: '/sign-in', locale: await getLocale() });
  }
};

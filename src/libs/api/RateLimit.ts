import 'server-only';
import { getTranslations } from 'next-intl/server';
import type { ActionResult } from './ApiError';

/**
 * The form message for a backend 429: how long to wait, rounded up to whole minutes.
 * @param response The backend response.
 * @returns The translated message.
 */
export const rateLimited = async (response: Response) => {
  const t = await getTranslations('AuthForm');
  const seconds = Number(response.headers.get('Retry-After'));

  return {
    ok: false,
    message: t('error_rate_limited', {
      minutes: Math.max(1, Math.ceil((Number.isFinite(seconds) ? seconds : 60) / 60)),
    }),
  } satisfies ActionResult;
};

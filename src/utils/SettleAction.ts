import { useTranslations } from 'next-intl';
import { unstable_rethrow } from 'next/navigation';
import type { ActionResult } from '@/libs/api/ApiError';

/**
 * Settles a server action's promise into a result, so that an action that rejects outright is a
 * refusal like any other: the caller shows it as it shows the others (a toast, the form's alert)
 * instead of the error boundary blanking the page or the form going quiet. A request that never
 * got through (fetch's `TypeError`: the browser is offline, the server can't be reached) says
 * so; one the server failed on (it threw, or a gateway answered) is the generic refusal. A
 * redirect (an ended session, a created record) is how an action answers, not a failure: it
 * passes through.
 * @returns A function that awaits the action's promise and gives its result, or a failed result
 *   with the translated "couldn't reach the server" or "that didn't work" message.
 */
export const useSettle = () => {
  const t = useTranslations('ActionError');
  const tApi = useTranslations('ApiError');

  return async <Result extends ActionResult>(
    answer: Promise<Result>,
  ): Promise<Result | ActionResult> => {
    try {
      return await answer;
    } catch (error) {
      unstable_rethrow(error);
      return { ok: false, message: error instanceof TypeError ? t('network') : tApi('generic') };
    }
  };
};

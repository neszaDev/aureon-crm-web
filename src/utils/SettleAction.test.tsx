import { NextIntlClientProvider } from 'next-intl';
import { redirect } from 'next/navigation';
import { describe, expect, it } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import type { ActionResult } from '@/libs/api/ApiError';
import messages from '@/locales/en.json';
import { useSettle } from './SettleAction';

const settleOf = async () => {
  const { result } = await renderHook(() => useSettle(), {
    wrapper: (props) => (
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        {props.children}
      </NextIntlClientProvider>
    ),
  });

  return result.current;
};

// A server action that ends the session: after its request its `redirect()` reaches the browser as
// a Next router error.
const endSession = async (): Promise<ActionResult> => {
  await Promise.resolve();
  return redirect('/sign-in?expired=1');
};

describe(useSettle, () => {
  it("passes an action's result through", async () => {
    const settle = await settleOf();

    await expect(settle(Promise.resolve({ ok: true }))).resolves.toStrictEqual({ ok: true });
    await expect(settle(Promise.resolve({ ok: false, message: 'Nope' }))).resolves.toStrictEqual({
      ok: false,
      message: 'Nope',
    });
  });

  it('turns an action that rejects, the browser being offline, into the translated network refusal', async () => {
    const settle = await settleOf();

    await expect(settle(Promise.reject(new TypeError('Failed to fetch')))).resolves.toStrictEqual({
      ok: false,
      message: messages.ActionError.network,
    });
  });

  it('rethrows a redirect, which is how an action answers (an ended session), not a failure', async () => {
    const settle = await settleOf();

    await expect(settle(endSession())).rejects.toMatchObject({
      digest: expect.stringContaining('NEXT_REDIRECT'),
    });
  });
});

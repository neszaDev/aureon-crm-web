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

  it('turns an action the server failed on into the generic refusal, not the network one', async () => {
    const settle = await settleOf();
    // What the browser gets when the action throws on the server: an error with a digest, its
    // message hidden in production; or a reply that isn't the action's (a proxy's 502 page).
    const crashed = Object.assign(new Error('An error occurred in the Server Components render.'), {
      digest: '2381234567',
    });

    await expect(settle(Promise.reject(crashed))).resolves.toStrictEqual({
      ok: false,
      message: messages.ApiError.generic,
    });
    await expect(
      settle(Promise.reject(new Error('An unexpected response was received from the server.'))),
    ).resolves.toStrictEqual({ ok: false, message: messages.ApiError.generic });
  });

  it('rethrows a redirect, which is how an action answers (an ended session), not a failure', async () => {
    const settle = await settleOf();

    await expect(settle(endSession())).rejects.toMatchObject({
      digest: expect.stringContaining('NEXT_REDIRECT'),
    });
  });
});

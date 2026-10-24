import { createTranslator } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import messages from '@/locales/en.json';
import { createWorkspace } from './WorkspaceActions';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('next-intl/server'), () => ({ getTranslations: vi.fn<typeof getTranslations>() }));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
// Its real module needs Next's runtime; the action imports it for redirects.
vi.mock(import('@/libs/I18nNavigation'), () => ({}));

describe(createWorkspace, () => {
  it('says the workspace was not created when the backend answers without one', async () => {
    vi.mocked(getTranslations).mockResolvedValue(
      createTranslator({ locale: 'en', messages, namespace: 'WorkspaceForm' }),
    );
    const api = {
      POST: async () => await Promise.resolve({ response: new Response(null, { status: 201 }) }),
    };
    // @ts-expect-error -- only the call this action makes
    vi.mocked(authedBackend).mockResolvedValue(api);

    const result = await createWorkspace({ name: 'Acme', defaultCurrency: 'USD', timezone: 'UTC' });

    expect(result).toStrictEqual({
      ok: false,
      message: "The workspace wasn't created. Try again.",
    });
  });
});

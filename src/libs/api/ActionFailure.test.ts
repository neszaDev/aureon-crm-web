import { createTranslator } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';
import messages from '@/locales/en.json';
import { actionFailure } from './ActionFailure';

vi.mock(import('server-only'), () => ({}));
// @ts-expect-error -- a real English translator of the namespace asked for
vi.mock(import('next-intl/server'), () => ({
  getTranslations: async (namespace: 'ApiError') =>
    await Promise.resolve(createTranslator({ locale: 'en', messages, namespace })),
}));
vi.mock(import('./Session'), () => ({ redirectIfUnauthorized: vi.fn<() => Promise<void>>() }));

const refusal = (code: string, status = 409) => ({
  status,
  code,
  message: 'English message',
  path: '/api/v1/workspaces/1/tasks/4/complete',
});

describe(actionFailure, () => {
  it.each(['VERSION_CONFLICT', 'TASK_STATUS_CONFLICT', 'LEAD_CONVERTED', 'LEAD_NOT_QUALIFIED'])(
    'offers a reload when %s says the record changed meanwhile',
    async (code) => {
      const result = await actionFailure(new Response(null, { status: 409 }), refusal(code));

      expect(result).toMatchObject({ ok: false, conflict: true });
      expect(result.message).toMatch(/Reload to see/u);
    },
  );

  it('offers none for a refusal a reload does not change', async () => {
    const result = await actionFailure(new Response(null, { status: 409 }), refusal('LAST_OWNER'));

    expect(result.conflict).toBeUndefined();
  });
});

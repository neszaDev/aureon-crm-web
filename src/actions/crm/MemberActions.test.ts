import { createTranslator } from 'next-intl';
import { getTranslations } from 'next-intl/server';
import { describe, expect, it, vi } from 'vitest';
import { authedBackend } from '@/libs/api/Backend';
import messages from '@/locales/en.json';
import { changeMemberRole } from './MemberActions';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('next-intl/server'), () => ({ getTranslations: vi.fn<typeof getTranslations>() }));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
// Its real module needs Next's runtime; the action imports it for redirects.
vi.mock(import('@/libs/I18nNavigation'), () => ({}));

describe(changeMemberRole, () => {
  it('refuses an unknown role with a message the dialog can show', async () => {
    vi.mocked(getTranslations).mockResolvedValue(
      createTranslator({ locale: 'en', messages, namespace: 'MembersTable' }),
    );

    // @ts-expect-error -- a role only a crafted request sends
    const result = await changeMemberRole(1, 2, 'BOSS');

    expect(result).toStrictEqual({ ok: false, message: "The role wasn't changed. Try again." });
    expect(authedBackend).not.toHaveBeenCalled();
  });
});

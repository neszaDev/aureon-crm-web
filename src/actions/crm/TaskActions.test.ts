import { refresh } from 'next/cache';
import { describe, expect, it, vi } from 'vitest';
import { actionFailure } from '@/libs/api/ActionFailure';
import { authedBackend } from '@/libs/api/Backend';
import { addTask } from './TaskActions';

vi.mock(import('server-only'), () => ({}));
// @ts-expect-error -- a translator that gives the key back
vi.mock(import('next-intl/server'), () => ({
  getTranslations: async () => await Promise.resolve((key: string) => key),
}));
vi.mock(import('next/cache'), () => ({ refresh: vi.fn<() => void>() }));
vi.mock(import('@/libs/api/Backend'), () => ({ authedBackend: vi.fn<typeof authedBackend>() }));
vi.mock(import('@/libs/api/ActionFailure'), () => ({
  actionFailure: vi.fn<typeof actionFailure>(),
}));

const backend = (status: number) => {
  const POST = vi
    .fn<(path: string, init: unknown) => Promise<unknown>>()
    .mockResolvedValue({ data: { id: 3 }, response: new Response(null, { status }) });
  // @ts-expect-error -- only the call this action makes
  vi.mocked(authedBackend).mockResolvedValue({ POST });

  return POST;
};

describe(addTask, () => {
  it('creates the task for the assignee, due as its group is, and refreshes the list', async () => {
    const POST = backend(201);

    const result = await addTask(1, { assigneeId: 4, dueAt: '2026-10-19T16:59:00.000Z' }, 'Call');

    expect(result).toStrictEqual({ ok: true });
    expect(POST).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/tasks', {
      params: { path: { workspaceId: 1 } },
      body: expect.objectContaining({
        title: 'Call',
        assigneeId: 4,
        dueAt: '2026-10-19T16:59:00.000Z',
        priority: 'MEDIUM',
      }),
    });
    expect(refresh).toHaveBeenCalledWith();
  });

  it("gives the row's name field the refusal of the title", async () => {
    backend(400);
    vi.mocked(actionFailure).mockResolvedValueOnce({
      ok: false,
      message: 'Check the highlighted fields',
      fieldErrors: { title: 'Too long' },
    });

    const result = await addTask(1, { assigneeId: null, dueAt: null }, 'Call');

    expect(result.fieldErrors).toStrictEqual({ name: 'Too long' });
  });
});

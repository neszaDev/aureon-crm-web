import { refresh } from 'next/cache';
import { describe, expect, it, vi } from 'vitest';
import { actionFailure } from '@/libs/api/ActionFailure';
import { authedBackend } from '@/libs/api/Backend';
import { addTask, assignTask } from './TaskActions';

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

describe(assignTask, () => {
  it('reads the task and saves every field back, at the list’s version, with the new assignee', async () => {
    const GET = vi.fn<(path: string, init: unknown) => Promise<unknown>>().mockResolvedValue({
      data: {
        id: 7,
        title: 'Call back',
        priority: 'HIGH',
        status: 'OPEN',
        dueAt: '2026-10-30T09:00:00Z',
        assignee: { userId: 2 },
        company: { id: 4, name: 'Acme' },
        contact: { id: 5, fullName: 'Ana' },
        version: 6,
      },
      response: new Response(null, { status: 200 }),
    });
    const PUT = vi
      .fn<(path: string, init: unknown) => Promise<unknown>>()
      .mockResolvedValue({ response: new Response(null, { status: 200 }) });
    // @ts-expect-error -- only the calls this action makes
    vi.mocked(authedBackend).mockResolvedValue({ GET, PUT });

    const result = await assignTask(1, 7, 5, 3);

    expect(result).toStrictEqual({ ok: true });
    expect(GET).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/tasks/{id}', {
      params: { path: { workspaceId: 1, id: 7 } },
    });
    expect(PUT).toHaveBeenCalledWith('/api/v1/workspaces/{workspaceId}/tasks/{id}', {
      params: { path: { workspaceId: 1, id: 7 } },
      body: {
        title: 'Call back',
        description: undefined,
        dueAt: '2026-10-30T09:00:00Z',
        priority: 'HIGH',
        assigneeId: 3,
        // Linked to a contact, its company is the backend's to derive again.
        companyId: undefined,
        contactId: 5,
        leadId: undefined,
        dealId: undefined,
        version: 5,
      },
    });
  });

  it('answers a refused read with its refusal and saves nothing', async () => {
    const GET = vi.fn<(path: string, init: unknown) => Promise<unknown>>().mockResolvedValue({
      error: { status: 404 },
      response: new Response(null, { status: 404 }),
    });
    const PUT = vi.fn<(path: string, init: unknown) => Promise<unknown>>();
    // @ts-expect-error -- only the calls this action makes
    vi.mocked(authedBackend).mockResolvedValue({ GET, PUT });
    vi.mocked(actionFailure).mockResolvedValue({ ok: false, message: 'Not found' });

    await expect(assignTask(1, 7, 5, 3)).resolves.toStrictEqual({
      ok: false,
      message: 'Not found',
    });
    expect(PUT).not.toHaveBeenCalled();
  });
});

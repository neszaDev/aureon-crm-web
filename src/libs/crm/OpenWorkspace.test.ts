import { notFound } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getWorkspace } from '@/libs/api/CrmQueries';
import { endRejectedSession } from '@/libs/api/Session';
import { getOpenWorkspace } from './OpenWorkspace';

vi.mock(import('server-only'), () => ({}));
vi.mock(import('next/navigation'), () => ({ notFound: vi.fn<typeof notFound>() }));
vi.mock(import('@/libs/api/Session'), () => ({
  endRejectedSession: vi.fn<typeof endRejectedSession>(),
}));
vi.mock(import('@/libs/api/CrmQueries'), () => ({ getWorkspace: vi.fn<typeof getWorkspace>() }));

const FLAGS = { unauthorized: false, forbidden: false, notFound: false };

describe(getOpenWorkspace, () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Both end the render by throwing, like Next's redirect and notFound.
    vi.mocked(endRejectedSession).mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    vi.mocked(notFound).mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
  });

  it('ends a session the backend rejected', async () => {
    vi.mocked(getWorkspace).mockResolvedValue({
      workspace: undefined,
      ...FLAGS,
      unauthorized: true,
    });

    await expect(getOpenWorkspace('fr', '7')).rejects.toThrow('NEXT_REDIRECT');
    expect(getWorkspace).toHaveBeenCalledWith('7');
    expect(endRejectedSession).toHaveBeenCalledWith('fr');
    expect(notFound).not.toHaveBeenCalled();
  });

  it('shows "not found" for a workspace that is gone', async () => {
    vi.mocked(getWorkspace).mockResolvedValue({ workspace: undefined, ...FLAGS, notFound: true });

    await expect(getOpenWorkspace('en', '7')).rejects.toThrow('NEXT_NOT_FOUND');
    expect(endRejectedSession).not.toHaveBeenCalled();
  });

  it('returns the workspace otherwise, a 403 included', async () => {
    const result = { workspace: undefined, ...FLAGS, forbidden: true };
    vi.mocked(getWorkspace).mockResolvedValue(result);

    await expect(getOpenWorkspace('en', '7')).resolves.toBe(result);
  });
});

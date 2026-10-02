import { describe, expect, it, vi } from 'vitest';
import type { NotificationApi } from './desktopNotification';
import { sendDesktopNotification } from './desktopNotification';

const message = { title: 'Report ready', body: 'Spring term marks are in.' };

/**
 * A stand-in for the browser's Notification constructor.
 * @param options The permission it starts with, what the prompt answers, and whether
 *   constructing throws.
 * @param options.permission Current permission.
 * @param options.answer What `requestPermission` resolves to.
 * @param options.throws Make the constructor throw, as on Android Chrome.
 * @returns The fake API and the spy that records constructed notifications.
 */
const fakeApi = (options: {
  permission: NotificationPermission;
  answer?: NotificationPermission;
  throws?: boolean;
}) => {
  const created = vi.fn<(title: string, body?: string) => void>();
  const requestPermission = vi
    .fn<() => Promise<NotificationPermission>>()
    .mockResolvedValue(options.answer ?? options.permission);
  class FakeNotification extends EventTarget {
    static readonly permission = options.permission;

    static readonly requestPermission = requestPermission;

    constructor(title: string, init?: NotificationOptions) {
      super();
      if (options.throws) {
        throw new TypeError('Illegal constructor');
      }
      created(title, init?.body);
    }
  }
  const api: NotificationApi = FakeNotification;
  return { api, created, requestPermission };
};

describe(sendDesktopNotification, () => {
  it('reports unsupported when the browser has no Notification API', async () => {
    await expect(sendDesktopNotification(undefined, message)).resolves.toBe('unsupported');
  });

  it('shows the notification straight away once permission is granted', async () => {
    const { api, created, requestPermission } = fakeApi({ permission: 'granted' });

    await expect(sendDesktopNotification(api, message)).resolves.toBe('shown');
    expect(requestPermission).not.toHaveBeenCalled();
    expect(created).toHaveBeenCalledWith('Report ready', 'Spring term marks are in.');
  });

  it('asks first, then shows it when the user allows', async () => {
    const { api, created, requestPermission } = fakeApi({
      permission: 'default',
      answer: 'granted',
    });

    await expect(sendDesktopNotification(api, message)).resolves.toBe('shown');
    expect(requestPermission).toHaveBeenCalledOnce();
    expect(created).toHaveBeenCalledOnce();
  });

  it('reports dismissed when the prompt closes without a choice', async () => {
    const { api, created } = fakeApi({ permission: 'default', answer: 'default' });

    await expect(sendDesktopNotification(api, message)).resolves.toBe('dismissed');
    expect(created).not.toHaveBeenCalled();
  });

  it('reports denied without asking again when notifications are blocked', async () => {
    const { api, requestPermission } = fakeApi({ permission: 'denied' });

    await expect(sendDesktopNotification(api, message)).resolves.toBe('denied');
    expect(requestPermission).not.toHaveBeenCalled();
  });

  it('reports unsupported when the constructor is refused', async () => {
    const { api } = fakeApi({ permission: 'granted', throws: true });

    await expect(sendDesktopNotification(api, message)).resolves.toBe('unsupported');
  });
});

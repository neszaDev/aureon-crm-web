/** The part of the browser `Notification` API the demo uses (injectable for tests). */
export type NotificationApi = {
  readonly permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  new (
    title: string,
    options?: NotificationOptions,
  ): { addEventListener: (type: 'click', listener: () => void) => void };
};

export type DesktopNotificationResult = 'shown' | 'denied' | 'dismissed' | 'unsupported';

/**
 * Shows a desktop notification, asking for permission first when the user has not decided.
 * @param api The browser's `Notification` constructor, or `undefined` where it is missing.
 * @param message The notification text.
 * @param message.title Title line.
 * @param message.body Body text.
 * @returns What happened: shown, denied (blocked by the user), dismissed (the permission
 *   prompt was closed without a choice) or unsupported.
 */
export const sendDesktopNotification = async (
  api: NotificationApi | undefined,
  message: { title: string; body: string },
): Promise<DesktopNotificationResult> => {
  if (!api) {
    return 'unsupported';
  }
  const permission = api.permission === 'default' ? await api.requestPermission() : api.permission;
  if (permission === 'denied') {
    return 'denied';
  }
  if (permission !== 'granted') {
    return 'dismissed';
  }
  // Some mobile browsers expose the API but only allow notifications from a service worker,
  // and throw on the constructor.
  try {
    const notification = new api(message.title, { body: message.body, tag: 'marksheet-demo' });
    notification.addEventListener('click', () => {
      window.focus();
    });
    return 'shown';
  } catch {
    return 'unsupported';
  }
};

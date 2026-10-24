'use server';

import { getReminders } from '@/libs/api/CrmQueries';
import { redirectIfUnauthorized } from '@/libs/api/Session';
import { slimReminders } from '@/libs/crm/Reminders';
import { todayIn } from '@/libs/crm/ZonedTime';

/**
 * Reads the caller's reminders again (`GET /workspaces/{id}/reminders`), for the bell to refresh
 * itself: the layout reads them only when it renders. A 401 ends the session, as on any page.
 * @param workspaceId The workspace.
 * @param timeZone The workspace's time zone: the day they are read on is today there.
 * @returns The reminders as the bell takes them; undefined when the backend failed, so the bell
 *   keeps what it has.
 */
export async function loadReminders(workspaceId: number, timeZone: string) {
  // First: a zone that is not one throws before the backend is asked anything.
  const today = todayIn(timeZone);
  const { reminders, unauthorized } = await getReminders(String(workspaceId));
  if (unauthorized) {
    await redirectIfUnauthorized(401);
  }

  return reminders ? slimReminders(reminders, today) : undefined;
}

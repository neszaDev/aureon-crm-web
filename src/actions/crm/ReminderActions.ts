'use server';

import { getReminders } from '@/libs/api/CrmQueries';
import { redirectIfUnauthorized } from '@/libs/api/Session';
import { slimReminders } from '@/libs/crm/Reminders';

/**
 * Reads the caller's reminders again (`GET /workspaces/{id}/reminders`), for the bell to refresh
 * itself: the layout reads them only when it renders. A 401 ends the session, as on any page.
 * @param workspaceId The workspace.
 * @returns The reminders as the bell takes them; undefined when the backend failed, so the bell
 *   keeps what it has.
 */
export async function loadReminders(workspaceId: number) {
  const { reminders, unauthorized } = await getReminders(String(workspaceId));
  if (unauthorized) {
    await redirectIfUnauthorized(401);
  }

  return reminders ? slimReminders(reminders) : undefined;
}

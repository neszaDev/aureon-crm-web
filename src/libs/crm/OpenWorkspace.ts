import 'server-only';
import { notFound } from 'next/navigation';
import { getWorkspace } from '@/libs/api/CrmQueries';
import { endRejectedSession } from '@/libs/api/Session';

/**
 * The workspace a page under `[workspaceId]` shows. The workspace layout handles a lost session
 * and an unknown workspace on a full load, but a client navigation inside the workspace renders
 * only the page: a member removed meanwhile must still get "Workspace not found", not an error.
 * @param locale The page's locale.
 * @param workspaceId The `[workspaceId]` route segment.
 * @returns The cached `getWorkspace` result (a 403 or 5xx is left to the page).
 */
export const getOpenWorkspace = async (locale: string, workspaceId: string) => {
  const result = await getWorkspace(workspaceId);
  if (result.unauthorized) {
    return endRejectedSession(locale);
  }
  if (result.notFound) {
    notFound();
  }

  return result;
};

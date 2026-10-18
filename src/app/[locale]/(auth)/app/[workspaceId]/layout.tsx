import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { CrmShell } from '@/components/crm/shell/CrmShell';
import { PickerFrame } from '@/components/crm/shell/PickerFrame';
import { getMyWorkspaces, getReminders, getWorkspace } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';

export default async function WorkspaceLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string; workspaceId: string }>;
}) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);

  // The reminders are read with the rest, each time the layout renders: on a full load, and after
  // every action that refreshes the page, so the bell's count follows what changed.
  const [{ user }, current, mine, reminders] = await Promise.all([
    getCurrentUser(),
    getWorkspace(workspaceId),
    getMyWorkspaces(),
    getReminders(workspaceId),
  ]);
  if (current.unauthorized || mine.unauthorized || reminders.unauthorized) {
    return endRejectedSession(locale);
  }
  if (current.notFound) {
    notFound();
  }
  if (current.forbidden) {
    return (
      <PickerFrame user={user}>
        <ForbiddenNotice page />
      </PickerFrame>
    );
  }
  const { workspace } = current;
  if (!user || !workspace || !mine.workspaces) {
    // A 5xx or a malformed answer: the error boundary offers a retry, never a sign-in loop.
    throw new Error('Could not load the workspace');
  }

  return (
    <CrmShell
      workspace={{ id: workspace.id, name: workspace.name, timeZone: workspace.timezone }}
      workspaces={mine.workspaces}
      user={{ email: user.email, displayName: user.displayName }}
      // Any other answer (a 5xx) leaves the bell saying so, and the page usable.
      reminders={reminders.reminders}
    >
      {props.children}
    </CrmShell>
  );
}

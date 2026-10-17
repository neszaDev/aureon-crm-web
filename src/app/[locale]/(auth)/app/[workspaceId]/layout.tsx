import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { CrmShell } from '@/components/crm/shell/CrmShell';
import { PickerFrame } from '@/components/crm/shell/PickerFrame';
import { getMyWorkspaces, getWorkspace } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';

export default async function WorkspaceLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string; workspaceId: string }>;
}) {
  const { locale, workspaceId } = await props.params;
  setRequestLocale(locale);

  const [{ user }, current, mine] = await Promise.all([
    getCurrentUser(),
    getWorkspace(workspaceId),
    getMyWorkspaces(),
  ]);
  if (current.unauthorized || mine.unauthorized) {
    return endRejectedSession(locale);
  }
  if (current.notFound) {
    notFound();
  }
  if (current.forbidden) {
    return (
      <PickerFrame user={user}>
        <ForbiddenNotice />
      </PickerFrame>
    );
  }
  const { workspace } = current;
  if (!user?.email || workspace?.id === undefined || !mine.workspaces) {
    // A 5xx or a malformed answer: the error boundary offers a retry, never a sign-in loop.
    throw new Error('Could not load the workspace');
  }

  return (
    <CrmShell
      workspace={{ id: workspace.id, name: workspace.name ?? '' }}
      workspaces={mine.workspaces}
      user={{ email: user.email, displayName: user.displayName }}
    >
      {props.children}
    </CrmShell>
  );
}

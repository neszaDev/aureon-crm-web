import { PencilIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { RecordHeader } from '@/components/crm/record/RecordHeader';
import { RecordNotFound } from '@/components/crm/record/RecordNotFound';
import { TaskDialog } from '@/components/crm/task/TaskDialog';
import { TaskFacts } from '@/components/crm/task/TaskFacts';
import { TaskStatusActions } from '@/components/crm/task/TaskStatusActions';
import { Button } from '@/components/ui/button';
import { getMembers, getTask } from '@/libs/api/CrmQueries';
import { getCurrentUser } from '@/libs/api/Queries';
import { endRejectedSession } from '@/libs/api/Session';
import { recordNumber } from '@/libs/crm/Format';
import { getOpenWorkspace } from '@/libs/crm/OpenWorkspace';
import { workspacePageMetadata } from '@/libs/crm/PageMetadata';
import { canAssign, canEditRecord } from '@/libs/crm/RecordAccess';

type TaskPageProps = {
  params: Promise<{ locale: string; workspaceId: string; id: string }>;
};

export async function generateMetadata(props: TaskPageProps): Promise<Metadata> {
  const { locale, workspaceId, id } = await props.params;
  const t = await getTranslations({ locale, namespace: 'RecordNotFound' });
  const { task, forbidden } = await getTask(workspaceId, id);

  return await workspacePageMetadata({
    locale,
    workspaceId,
    title: task?.title ?? t('title'),
    forbidden,
  });
}

export default async function TaskPage(props: TaskPageProps) {
  const { locale, workspaceId, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TaskPage' });
  const tRow = await getTranslations({ locale, namespace: 'TaskRow' });

  // The workspace (a cached call); a lost one is "not found" even on a client navigation.
  const [{ workspace }, { user }, result, members] = await Promise.all([
    getOpenWorkspace(locale, workspaceId),
    getCurrentUser(),
    getTask(workspaceId, id),
    getMembers(workspaceId),
  ]);
  if (result.unauthorized || members.unauthorized) {
    return endRejectedSession(locale);
  }
  if (!workspace) {
    throw new Error('Could not load the workspace');
  }
  if (result.notFound) {
    return <RecordNotFound href={`/app/${workspace.id}/tasks`} backLabel={t('back')} />;
  }
  if (result.forbidden) {
    return <ForbiddenNotice page />;
  }
  const { task } = result;
  if (!task || !user || !members.members) {
    throw new Error('Could not load the task');
  }
  const actions = canEditRecord(
    workspace,
    user.id,
    task.assignee?.userId,
    task.createdBy?.userId,
  ) && (
    <>
      <TaskDialog
        trigger={
          <Button variant="outline">
            <PencilIcon data-icon="inline-start" />
            {t('edit')}
          </Button>
        }
        workspaceId={workspace.id}
        task={task}
        members={members.members}
        me={user.id}
        canAssign={canAssign(workspace)}
        timeZone={workspace.timezone}
      />
      <TaskStatusActions task={task} workspaceId={workspace.id} />
    </>
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <RecordHeader
        number={recordNumber('task', task.id)}
        name={task.title}
        headingId="task-heading"
        owner={task.assignee}
        assigned
        archived={false}
        status={task.status === 'OPEN' ? undefined : tRow(`status_${task.status}`)}
        actions={actions}
      />
      <TaskFacts task={task} workspaceId={workspace.id} timeZone={workspace.timezone} />
    </div>
  );
}

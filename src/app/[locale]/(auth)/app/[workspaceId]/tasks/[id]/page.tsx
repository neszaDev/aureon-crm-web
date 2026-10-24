import { PencilIcon } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { RecordHistory } from '@/components/crm/audit/RecordHistory';
import { ForbiddenNotice } from '@/components/crm/ForbiddenNotice';
import { RecordHeader } from '@/components/crm/record/RecordHeader';
import { RecordColumns, RecordPage } from '@/components/crm/record/RecordLayout';
import { RecordNotFound } from '@/components/crm/record/RecordNotFound';
import { TaskDialog } from '@/components/crm/task/TaskDialog';
import { TaskFacts } from '@/components/crm/task/TaskFacts';
import { TaskStatusPill } from '@/components/crm/task/TaskStatusPill';
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

// Its full page, and its panel over the page it was opened from (`@panel`).
export default async function TaskPage(props: TaskPageProps) {
  const { locale, workspaceId, id } = await props.params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'TaskPage' });

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
  const canEdit = canEditRecord(workspace, user.id, task.assignee?.userId, task.createdBy?.userId);

  return (
    <RecordPage
      header={
        <RecordHeader
          number={recordNumber('task', task.id)}
          name={task.title}
          headingId="task-heading"
          owner={task.assignee}
          assigned
          archived={false}
          // The status as its pill: completes, cancels (once confirmed) or reopens the task.
          status={
            <TaskStatusPill
              task={task}
              workspaceId={workspace.id}
              canEdit={canEdit}
              headingId="task-heading"
            />
          }
          actions={
            canEdit && (
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
            )
          }
        />
      }
    >
      <RecordColumns
        left={<TaskFacts task={task} workspaceId={workspace.id} timeZone={workspace.timezone} />}
        right={<RecordHistory workspace={workspace} entityType="TASK" entityId={task.id} />}
      />
    </RecordPage>
  );
}

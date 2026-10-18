import { getLocale } from 'next-intl/server';
import { ActivityTimeline } from '@/components/crm/activity/ActivityTimeline';
import { TaskPanel } from '@/components/crm/task/TaskPanel';
import { getRecordWork } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import { endRejectedSession } from '@/libs/api/Session';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';

/**
 * A record page's tasks and activity, under its details: the tasks panel ("Add task" on this
 * record) and the timeline with its composer. It loads them itself, once the record is found.
 * @param props Component props.
 * @param props.workspace The workspace, with the caller's permissions and its time zone.
 * @param props.me The caller's user id.
 * @param props.link The record, such as `{ companyId: 7 }`.
 * @param props.label The record's name.
 * @returns The two sections.
 */
export const RecordWork = async (props: {
  workspace: components['schemas']['WorkspaceResponse'];
  me: number;
  link: ActivityLink;
  label: string;
}) => {
  const work = await getRecordWork(String(props.workspace.id), props.link);
  if (work.unauthorized) {
    return endRejectedSession(await getLocale());
  }
  const { open, closed, activities, members } = work;
  if (!open || !closed || !activities || !members) {
    throw new Error('Could not load the tasks and activity');
  }

  return (
    <>
      <TaskPanel
        workspaceId={props.workspace.id}
        link={props.link}
        label={props.label}
        open={open.content}
        openTotal={open.totalElements}
        closed={closed.content}
        closedTotal={closed.totalElements}
        members={members}
        me={props.me}
        permissions={props.workspace.permissions}
        timeZone={props.workspace.timezone}
      />
      <ActivityTimeline
        workspaceId={props.workspace.id}
        link={props.link}
        first={activities.content}
        total={activities.totalElements}
        me={props.me}
        permissions={props.workspace.permissions}
        timeZone={props.workspace.timezone}
        now={work.readAt}
      />
    </>
  );
};

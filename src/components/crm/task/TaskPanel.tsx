'use client';

import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { SECTION_NOTE } from '@/components/crm/record/RecordLayout';
import { usePanelId } from '@/components/crm/record/RecordPanel';
import { RecordSection } from '@/components/crm/record/RecordSection';
import { TaskDialog } from '@/components/crm/task/TaskDialog';
import { TaskTable } from '@/components/crm/task/TaskTable';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { components } from '@/libs/api/schema';
import type { Permission } from '@/libs/crm/Permissions';
import { canAssign } from '@/libs/crm/RecordAccess';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';

type Task = components['schemas']['TaskResponse'];

/**
 * A record's tasks as compact rows (tick to complete, the menu cancels or reopens): its open ones
 * by due time, the completed and cancelled ones behind a switch (latest first), and "Add task",
 * which opens a task on this record, for the caller by default.
 * @param props Component props.
 * @param props.workspaceId The workspace.
 * @param props.link The record, such as `{ companyId: 7 }`.
 * @param props.label The record's name.
 * @param props.open Its open tasks, by due time (the first page).
 * @param props.openTotal How many open tasks it has.
 * @param props.closed Its completed and cancelled tasks, latest first (the first page).
 * @param props.closedTotal How many of those it has.
 * @param props.members The workspace's members, for the assignee.
 * @param props.me The caller's user id.
 * @param props.permissions The caller's permissions.
 * @param props.timeZone The workspace's time zone.
 * @param props.now When the page was read (an ISO instant), for a phone's short due times.
 * @returns The panel.
 */
export const TaskPanel = (props: {
  workspaceId: number;
  link: ActivityLink;
  label: string;
  open: Task[];
  openTotal: number;
  closed: Task[];
  closedTotal: number;
  members: components['schemas']['MemberRef'][];
  me: number;
  permissions: Permission[];
  timeZone: string;
  now: string;
}) => {
  const t = useTranslations('TaskPanel');
  const [showClosed, setShowClosed] = useState(false);
  const headingId = usePanelId(`tasks-heading-${Object.keys(props.link)[0]}`);
  const table = (tasks: Task[]) => (
    <TaskTable
      tasks={tasks}
      workspaceId={props.workspaceId}
      permissions={props.permissions}
      me={props.me}
      timeZone={props.timeZone}
      viewed={props.link}
      headingId={headingId}
      compact
      now={props.now}
    />
  );

  return (
    <RecordSection
      headingId={headingId}
      title={t('title')}
      count={t('count', { count: props.openTotal })}
      action={
        <TaskDialog
          trigger={
            <Button variant="ghost" size="sm">
              <PlusIcon data-icon="inline-start" />
              {t('add')}
            </Button>
          }
          workspaceId={props.workspaceId}
          link={props.link}
          linkLabel={props.label}
          members={props.members}
          me={props.me}
          canAssign={canAssign({ permissions: props.permissions })}
          timeZone={props.timeZone}
        />
      }
    >
      {props.open.length > 0 ? (
        <div className="border-b border-rule">{table(props.open)}</div>
      ) : (
        <p className={SECTION_NOTE}>{t('empty')}</p>
      )}
      {props.openTotal > props.open.length && (
        <p className={SECTION_NOTE}>
          {t('more', { shown: props.open.length, total: props.openTotal })}
        </p>
      )}
      <div className="flex min-h-9 items-center gap-2 py-1.5">
        <Switch id={`${headingId}-closed`} checked={showClosed} onCheckedChange={setShowClosed} />
        <Label htmlFor={`${headingId}-closed`} className="text-[0.8125rem] font-normal">
          {t('show_closed')}
        </Label>
      </div>
      {showClosed && (
        <div className="flex flex-col">
          <h3 className="border-b border-rule py-2 text-[0.8125rem] font-semibold">
            {t('closed_title', { count: props.closedTotal })}
          </h3>
          {props.closed.length > 0 ? (
            <div className="border-b border-rule">{table(props.closed)}</div>
          ) : (
            <p className={SECTION_NOTE}>{t('closed_empty')}</p>
          )}
          {props.closedTotal > props.closed.length && (
            <p className={SECTION_NOTE}>
              {t('more', { shown: props.closed.length, total: props.closedTotal })}
            </p>
          )}
        </div>
      )}
    </RecordSection>
  );
};

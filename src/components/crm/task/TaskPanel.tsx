'use client';

import { PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
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
 * A record's tasks: its open ones by due time, the completed and cancelled ones behind a switch
 * (latest first), and "Add task", which opens a task on this record, for the caller by default.
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
}) => {
  const t = useTranslations('TaskPanel');
  const [showClosed, setShowClosed] = useState(false);
  const headingId = `tasks-heading-${Object.keys(props.link)[0]}`;
  const table = (tasks: Task[]) => (
    <TaskTable
      tasks={tasks}
      workspaceId={props.workspaceId}
      permissions={props.permissions}
      me={props.me}
      timeZone={props.timeZone}
      viewed={props.link}
      headingId={headingId}
    />
  );

  return (
    <section aria-labelledby={headingId} className="rounded-lg border border-rule bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2
          id={headingId}
          tabIndex={-1}
          className="flex items-baseline gap-2 rounded-sm font-semibold"
        >
          {t('title')}
          <span className="text-sm font-normal text-muted-foreground tabular-nums">
            {t('count', { count: props.openTotal })}
          </span>
        </h2>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <div className="flex items-center gap-2">
            <Switch
              id={`${headingId}-closed`}
              checked={showClosed}
              onCheckedChange={setShowClosed}
            />
            <Label htmlFor={`${headingId}-closed`} className="text-sm">
              {t('show_closed')}
            </Label>
          </div>
          <TaskDialog
            trigger={
              <Button variant="outline">
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
        </div>
      </div>
      <div className="border-t border-rule">
        {props.open.length > 0 ? (
          table(props.open)
        ) : (
          <p className="px-5 py-4 text-muted-foreground">{t('empty')}</p>
        )}
        {props.openTotal > props.open.length && (
          <p className="border-t border-rule px-5 py-3 text-sm text-muted-foreground">
            {t('more', { shown: props.open.length, total: props.openTotal })}
          </p>
        )}
      </div>
      {showClosed && (
        <div className="border-t border-rule">
          <h3 className="px-5 pt-4 pb-3 text-sm font-semibold">
            {t('closed_title', { count: props.closedTotal })}
          </h3>
          {props.closed.length > 0 ? (
            <div className="border-t border-rule">{table(props.closed)}</div>
          ) : (
            <p className="border-t border-rule px-5 py-4 text-muted-foreground">
              {t('closed_empty')}
            </p>
          )}
          {props.closedTotal > props.closed.length && (
            <p className="border-t border-rule px-5 py-3 text-sm text-muted-foreground">
              {t('more', { shown: props.closed.length, total: props.closedTotal })}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

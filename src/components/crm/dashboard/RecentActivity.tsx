import { useLocale, useTranslations } from 'next-intl';
import { ActivityTypeIcon } from '@/components/crm/activity/ActivityComposer';
import { Panel } from '@/components/crm/dashboard/Panel';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import { LinkedRecords } from '@/components/crm/record/LinkedRecords';
import type { components } from '@/libs/api/schema';
import { formatInstant } from '@/libs/crm/Format';

/**
 * The latest activities in the workspace, newest first, as a feed: who logged each (their avatar
 * and name, or a former member), its type and when it happened in the workspace's time zone, its
 * subject, the start of its details, and the records it is on as links, which open in the side
 * panel. Read-only.
 * @param props Component props.
 * @param props.activities The dashboard's `recentActivities`.
 * @param props.workspaceId The workspace.
 * @param props.timeZone The workspace's time zone.
 * @returns The panel.
 */
export const RecentActivity = (props: {
  activities: components['schemas']['ActivityResponse'][];
  workspaceId: number;
  timeZone: string;
}) => {
  const t = useTranslations('RecentActivity');
  const tType = useTranslations('ActivityComposer');
  const locale = useLocale();

  return (
    <Panel id="recent-activity" title={t('title')}>
      {props.activities.length > 0 ? (
        <ul>
          {props.activities.map((activity) => (
            <li key={activity.id} className="flex gap-3 border-t border-rule px-4 py-3 sm:px-5">
              <PersonAvatar person={activity.author} size="sm" />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="flex flex-wrap items-center gap-x-2 text-[0.8125rem] text-muted-foreground">
                  <span className="font-medium break-words text-foreground">
                    {activity.author
                      ? (activity.author.displayName ?? activity.author.email)
                      : t('former')}
                  </span>
                  <span className="inline-flex items-center gap-1 [&_svg]:size-3.5">
                    <ActivityTypeIcon type={activity.type} />
                    {tType(`type_${activity.type}`)}
                  </span>
                  <time dateTime={activity.occurredAt} className="tabular-nums">
                    {formatInstant(activity.occurredAt, {
                      locale,
                      timeZone: props.timeZone,
                      withTime: true,
                    })}
                  </time>
                </p>
                <h3 className="text-sm font-medium break-words">{activity.subject}</h3>
                {activity.body && (
                  <p className="line-clamp-2 max-w-[65ch] text-[0.8125rem] break-words whitespace-pre-line text-muted-foreground">
                    {activity.body}
                  </p>
                )}
                <LinkedRecords
                  record={activity}
                  workspaceId={props.workspaceId}
                  label={t('on')}
                  className="text-[0.8125rem] text-muted-foreground"
                />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-t border-rule px-4 py-6 text-muted-foreground sm:px-5">{t('empty')}</p>
      )}
    </Panel>
  );
};

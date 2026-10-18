import { useTranslations } from 'next-intl';
import { ActivityItem } from '@/components/crm/activity/ActivityItem';
import { Panel } from '@/components/crm/dashboard/Panel';
import type { components } from '@/libs/api/schema';

/**
 * The latest activities in the workspace, newest first, as the timeline's own entries, compact
 * and read-only (each links to the records it is on).
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

  return (
    <Panel id="recent-activity" title={t('title')}>
      {props.activities.length > 0 ? (
        <ul>
          {props.activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              workspaceId={props.workspaceId}
              canEdit={false}
              timeZone={props.timeZone}
              compact
            />
          ))}
        </ul>
      ) : (
        <p className="border-t border-rule px-4 py-6 text-muted-foreground sm:px-5">{t('empty')}</p>
      )}
    </Panel>
  );
};

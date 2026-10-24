import { useTranslations } from 'next-intl';
import { AuditEventItem } from '@/components/crm/audit/AuditEventItem';
import { Panel } from '@/components/crm/dashboard/Panel';
import type { components } from '@/libs/api/schema';

/**
 * The latest changes to records, newest first: who did what, when, and the fields that changed.
 * @param props Component props.
 * @param props.events The dashboard's `recentChanges`.
 * @param props.workspace The workspace: its id and time zone.
 * @returns The panel.
 */
export const RecentChanges = (props: {
  events: components['schemas']['AuditEventResponse'][];
  workspace: Pick<components['schemas']['WorkspaceResponse'], 'id' | 'timezone'>;
}) => {
  const t = useTranslations('RecentChanges');

  return (
    <Panel id="recent-changes" title={t('title')}>
      {props.events.length > 0 ? (
        <ul>
          {props.events.map((event) => (
            <AuditEventItem key={event.id} event={event} workspace={props.workspace} compact />
          ))}
        </ul>
      ) : (
        <p className="border-t border-rule px-4 py-6 text-muted-foreground sm:px-5">{t('empty')}</p>
      )}
    </Panel>
  );
};

import { getLocale } from 'next-intl/server';
import { HistoryTimeline } from '@/components/crm/audit/HistoryTimeline';
import { getAuditEvents } from '@/libs/api/CrmQueries';
import type { components } from '@/libs/api/schema';
import { endRejectedSession } from '@/libs/api/Session';
import type { HISTORY_TYPES } from '@/libs/crm/Audit';
import { HISTORY_PAGE_SIZE } from '@/libs/crm/Audit';

/**
 * A record page's history, under its details and its work: the events on the record, newest
 * first, with "Show older". Any member may read it. It loads them itself, once the record is found.
 * @param props Component props.
 * @param props.workspace The workspace: its id and time zone.
 * @param props.entityType The kind of record.
 * @param props.entityId The record.
 * @returns The section.
 */
export const RecordHistory = async (props: {
  workspace: Pick<components['schemas']['WorkspaceResponse'], 'id' | 'timezone'>;
  entityType: (typeof HISTORY_TYPES)[number];
  entityId: number;
}) => {
  const result = await getAuditEvents(String(props.workspace.id), {
    entityType: props.entityType,
    entityId: props.entityId,
    page: 0,
    size: HISTORY_PAGE_SIZE,
  });
  if (result.unauthorized) {
    return endRejectedSession(await getLocale());
  }
  if (!result.events) {
    throw new Error('Could not load the history');
  }

  return (
    <HistoryTimeline
      workspace={props.workspace}
      entityType={props.entityType}
      entityId={props.entityId}
      first={result.events.content}
      total={result.events.totalElements}
    />
  );
};

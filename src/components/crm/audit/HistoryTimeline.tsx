'use client';

import { ChevronDownIcon, InboxIcon, LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { loadHistory } from '@/actions/crm/AuditActions';
import { AuditEventItem } from '@/components/crm/audit/AuditEventItem';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import type { HISTORY_TYPES } from '@/libs/crm/Audit';
import { HISTORY_PAGE_SIZE } from '@/libs/crm/Audit';
import { focusOnMount } from '@/utils/Focus';

type AuditEvent = components['schemas']['AuditEventResponse'];

// The backend's order: newest first, then by id descending.
const newestFirst = (a: AuditEvent, b: AuditEvent) =>
  Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || b.id - a.id;

/**
 * A record's history: its first events (from the server, so the page opens with them) and, under
 * "Show older", the ones before. Events never change, so each shows once: a page that overlaps
 * what is shown (events recorded meanwhile pushed the others down) adds only those older than the
 * last one shown, and one that adds none (a page or more recorded meanwhile) makes it ask for the
 * next. A refreshed first page puts the latest on top of everything loaded, unless it reaches none
 * of the events shown (a page or more recorded first): the older ones then go, so no gap opens
 * under it, and "Show older" brings them back in order. When the last page is in and the button
 * goes, the focus goes to the heading.
 * @param props Component props.
 * @param props.workspace The workspace: its id, for "Show older" and the links, and its time zone.
 * @param props.entityType The kind of record.
 * @param props.entityId The record.
 * @param props.first The first page, newest first.
 * @param props.total How many events the record has.
 * @returns The panel.
 */
export const HistoryTimeline = (props: {
  workspace: { id: number; timezone: string };
  entityType: (typeof HISTORY_TYPES)[number];
  entityId: number;
  first: AuditEvent[];
  total: number;
}) => {
  const t = useTranslations('RecordHistory');
  // What "Show older" added.
  const [older, setOlder] = useState<AuditEvent[]>([]);
  const [isLoading, startLoading] = useTransition();
  const [firstShown, setFirstShown] = useState(props.first);
  // A refreshed first page (an edit here) pushes its last events onto the next page: once older
  // ones show, the first page they followed stays too, so the list has no gap; unless the new one
  // shares no event with them, when what came between is unknown.
  if (props.first !== firstShown) {
    setFirstShown(props.first);
    if (older.length > 0) {
      const shown = new Set([...firstShown, ...older].map((item) => item.id));
      setOlder(props.first.some((item) => shown.has(item.id)) ? [...firstShown, ...older] : []);
    }
  }
  const events = [
    ...new Map([...props.first, ...older].map((item) => [item.id, item])).values(),
  ].toSorted(newestFirst);
  const done = events.length >= props.total;

  const showOlder = () => {
    if (isLoading) {
      return;
    }
    startLoading(async () => {
      // The page holding the first event not shown: those before it come again if the pages
      // moved since, and are left out (newer ones wait for a refresh). A full page with nothing
      // older means a page or more was recorded meanwhile: the next one goes on from there, as
      // far as there can be pages. (The API has no time bound for the history to ask by.)
      const last = events.at(-1);
      const pages = Math.ceil(props.total / HISTORY_PAGE_SIZE) + 1;
      let pageNumber = Math.floor(events.length / HISTORY_PAGE_SIZE);
      let next: AuditEvent[] = [];
      let added: AuditEvent[] = [];
      try {
        do {
          // oxlint-disable-next-line no-await-in-loop -- a page decides if the next is asked
          next = await loadHistory(
            props.workspace.id,
            props.entityType,
            props.entityId,
            pageNumber,
          );
          added = next.filter((item) => !last || newestFirst(item, last) > 0);
          pageNumber += 1;
        } while (added.length === 0 && next.length === HISTORY_PAGE_SIZE && pageNumber < pages);
      } catch {
        toast.error(t('older_failed'));
        return;
      }
      setOlder((current) => [...current, ...added]);
    });
  };

  return (
    <section aria-labelledby="history-heading" className="rounded-lg border border-rule bg-card">
      <h2
        id="history-heading"
        tabIndex={-1}
        // Once the last page is in, the button that had the focus is gone.
        ref={older.length > 0 && done ? focusOnMount : undefined}
        className="flex items-baseline gap-2 rounded-sm px-5 pt-4 pb-3 font-semibold"
      >
        {t('title')}
        <span className="text-sm font-normal text-muted-foreground tabular-nums">
          {t('count', { count: props.total })}
        </span>
      </h2>
      {events.length > 0 ? (
        // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops the list role
        <ul role="list">
          {events.map((item) => (
            <AuditEventItem key={item.id} event={item} workspace={props.workspace} ownPage />
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 border-t border-rule px-5 py-6 text-muted-foreground">
          <InboxIcon aria-hidden="true" className="size-5 shrink-0" />
          {t('empty')}
        </p>
      )}
      {!done && (
        <div className="border-t border-rule px-5 py-3">
          {/* aria-disabled, not disabled: a disabled button drops the focus to the page. */}
          <Button variant="outline" aria-disabled={isLoading || undefined} onClick={showOlder}>
            {isLoading ? (
              <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
            ) : (
              <ChevronDownIcon data-icon="inline-start" />
            )}
            {t('show_older')}
          </Button>
        </div>
      )}
    </section>
  );
};

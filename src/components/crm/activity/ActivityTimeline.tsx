'use client';

import { ChevronDownIcon, InboxIcon, LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLayoutEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { loadActivities, logActivity } from '@/actions/crm/ActivityActions';
import { ActivityComposer } from '@/components/crm/activity/ActivityComposer';
import { ActivityItem } from '@/components/crm/activity/ActivityItem';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import { PAGE_SIZES } from '@/libs/crm/ListQuery';
import type { Permission } from '@/libs/crm/Permissions';
import { canEditRecord } from '@/libs/crm/RecordAccess';
import { toInstant, toLocalInput } from '@/libs/crm/ZonedTime';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';

type Activity = components['schemas']['ActivityResponse'];

const newestFirst = (a: Activity, b: Activity) =>
  Date.parse(b.occurredAt) - Date.parse(a.occurredAt) || b.id - a.id;

/**
 * The timeline's activities: those of the pages shown, each once in its latest version (one
 * saved here may be newer than a page that still holds it), without those deleted here, newest
 * first.
 * @param shown The activities of the pages shown.
 * @param saved The activities saved here.
 * @param deleted The ids of those deleted here.
 * @returns The list.
 */
const timelineOf = (shown: Activity[], saved: Activity[], deleted: number[]) => {
  const latest = new Map<number, Activity>();
  for (const activity of shown) {
    const known = latest.get(activity.id);
    if (!known || activity.version >= known.version) {
      latest.set(activity.id, activity);
    }
  }
  // A saved copy replaces one shown; it never adds one (it may have moved past the pages).
  for (const activity of saved) {
    if ((latest.get(activity.id)?.version ?? Infinity) < activity.version) {
      latest.set(activity.id, activity);
    }
  }

  return [...latest.values()]
    .filter((activity) => !deleted.includes(activity.id))
    .toSorted(newestFirst);
};

/**
 * A record's activity: the composer that logs a call, email, meeting or note on it, then what
 * was logged, newest first (a company's includes its contacts' and deals'). The first page comes
 * from the server; "Show older" adds the next ones, each activity once even when the pages moved
 * meanwhile, and the focus goes to the first one it added. Edit and delete show for the author
 * and with `RECORDS_EDIT_ANY`.
 * @param props Component props.
 * @param props.workspaceId The workspace.
 * @param props.link The record, such as `{ companyId: 7 }`: what the composer logs on.
 * @param props.first The first page, newest first.
 * @param props.total How many activities the record has.
 * @param props.me The caller's user id.
 * @param props.permissions The caller's permissions.
 * @param props.timeZone The workspace's time zone.
 * @param props.now When the page was read: "When" starts at it.
 * @returns The panel.
 */
export const ActivityTimeline = (props: {
  workspaceId: number;
  link: ActivityLink;
  first: Activity[];
  total: number;
  me: number;
  permissions: Permission[];
  timeZone: string;
  now: string;
}) => {
  const t = useTranslations('ActivityTimeline');
  // What "Show older" added, and what was saved and deleted here (a page may still hold them).
  const [older, setOlder] = useState<Activity[]>([]);
  const [saved, setSaved] = useState<Activity[]>([]);
  const [deleted, setDeleted] = useState<number[]>([]);
  // The first activity "Show older" added: it takes the focus once shown (the button may be gone).
  const [firstAdded, setFirstAdded] = useState<number>();
  const [isLoading, startLoading] = useTransition();
  const [firstShown, setFirstShown] = useState(props.first);
  // A refreshed first page (an activity logged) pushes its last ones onto the next page: once
  // older ones show, they stay, so the list has no gap.
  if (props.first !== firstShown) {
    setFirstShown(props.first);
    if (older.length > 0) {
      setOlder([...firstShown, ...older]);
    }
  }
  const headingId = `activity-heading-${Object.keys(props.link)[0]}`;
  const items = timelineOf([...older, ...props.first], saved, deleted);

  const showOlder = () => {
    if (isLoading) {
      return;
    }
    startLoading(async () => {
      // The page holding the first activity not shown yet: those before it come again if the
      // pages moved since, and are dropped.
      const page = Math.floor(items.length / PAGE_SIZES[0]);
      let next: Activity[];
      try {
        next = await loadActivities(props.workspaceId, props.link, page);
      } catch {
        toast.error(t('older_failed'));
        return;
      }
      const added = next.filter((activity) => !items.some((item) => item.id === activity.id));
      setOlder((current) => [...current, ...added]);
      setFirstAdded(added[0]?.id);
    });
  };

  useLayoutEffect(() => {
    if (firstAdded !== undefined) {
      document.querySelector<HTMLElement>(`#activity-${firstAdded}`)?.focus();
    }
  }, [firstAdded]);

  return (
    <section aria-labelledby={headingId} className="rounded-lg border border-rule bg-card">
      <h2
        id={headingId}
        tabIndex={-1}
        className="flex items-baseline gap-2 rounded-sm px-5 pt-4 pb-3 font-semibold"
      >
        {t('title')}
        <span className="text-sm font-normal text-muted-foreground tabular-nums">
          {t('count', { count: props.total })}
        </span>
      </h2>
      <div className="border-t border-rule px-5 py-4">
        <ActivityComposer
          defaults={{
            type: 'CALL',
            subject: '',
            body: '',
            occurredAt: toLocalInput(props.now, props.timeZone),
          }}
          timeZone={props.timeZone}
          // Untouched, "When" is left to the backend: the moment it is logged.
          save={async (values, whenChanged) =>
            await logActivity(props.workspaceId, {
              ...values,
              occurredAt: whenChanged
                ? (toInstant(values.occurredAt, props.timeZone) ?? null)
                : null,
              companyId: null,
              contactId: null,
              leadId: null,
              dealId: null,
              ...props.link,
            })
          }
          savedMessage={t('logged')}
          submitLabel={t('log')}
        />
      </div>
      {items.length > 0 ? (
        // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- Safari drops the list role
        <ul role="list">
          {items.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              workspaceId={props.workspaceId}
              link={props.link}
              canEdit={canEditRecord(
                { permissions: props.permissions },
                props.me,
                activity.author?.userId,
              )}
              timeZone={props.timeZone}
              headingId={headingId}
              onSaved={(copy) => {
                setSaved((current) => [...current, copy]);
              }}
              onDeleted={(id) => {
                setDeleted((current) => [...current, id]);
              }}
            />
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 border-t border-rule px-5 py-6 text-muted-foreground">
          <InboxIcon aria-hidden="true" className="size-5 shrink-0" />
          {t('empty')}
        </p>
      )}
      {items.length < props.total && (
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

'use client';

import { PencilIcon, Trash2Icon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { deleteActivity, updateActivity } from '@/actions/crm/ActivityActions';
import { ActivityComposer, ActivityTypeIcon } from '@/components/crm/activity/ActivityComposer';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import { LinkedRecords } from '@/components/crm/record/LinkedRecords';
import { Button } from '@/components/ui/button';
import type { components } from '@/libs/api/schema';
import { formatInstant } from '@/libs/crm/Format';
import { toInstant, toLocalInput } from '@/libs/crm/ZonedTime';
import { focusOnMount } from '@/utils/Focus';
import type { ActivityLink } from '@/validations/crm/ActivityValidation';

type Activity = components['schemas']['ActivityResponse'];

/**
 * One entry of a timeline: its type, when it happened (in the workspace's time zone), the subject,
 * the details with their line breaks, who logged it (their avatar) and the records it is on, as
 * links, except the one being viewed. Its author and `RECORDS_EDIT_ANY` edit it in place or
 * delete it (confirmed).
 * @param props Component props.
 * @param props.activity The activity.
 * @param props.workspaceId The workspace.
 * @param props.link The record being viewed.
 * @param props.canEdit Whether the caller may edit and delete it.
 * @param props.timeZone The workspace's time zone.
 * @param props.headingId The timeline's heading, which takes the focus once it is deleted.
 * @param props.focused Whether its subject takes the focus as it appears ("Show older" added it).
 * @param props.onSaved Called with the saved activity.
 * @param props.onDeleted Called once it is deleted.
 * @returns The list item.
 */
export const ActivityItem = (props: {
  activity: Activity;
  workspaceId: number;
  link?: ActivityLink;
  canEdit: boolean;
  timeZone: string;
  headingId?: string;
  focused?: boolean;
  onSaved?: (activity: Activity) => void;
  onDeleted?: (id: number) => void;
}) => {
  const t = useTranslations('ActivityItem');
  const tType = useTranslations('ActivityComposer');
  const locale = useLocale();
  const [editing, setEditing] = useState(false);
  // Back from editing: the Edit button that replaced the form takes the focus.
  const [edited, setEdited] = useState(false);

  if (editing) {
    return (
      <li className="border-t border-rule px-5 py-4">
        <ActivityComposer
          defaults={{
            type: props.activity.type,
            subject: props.activity.subject,
            body: props.activity.body ?? '',
            occurredAt: toLocalInput(props.activity.occurredAt, props.timeZone),
          }}
          timeZone={props.timeZone}
          // Every field goes back, the links as they are; "When" only once changed, so an
          // edit elsewhere keeps its exact time.
          save={async (values, whenChanged) => {
            const result = await updateActivity(
              props.workspaceId,
              props.activity.id,
              props.activity.version,
              {
                ...values,
                occurredAt: whenChanged
                  ? (toInstant(values.occurredAt, props.timeZone) ?? null)
                  : null,
                companyId: props.activity.company?.id ?? null,
                contactId: props.activity.contact?.id ?? null,
                leadId: props.activity.lead?.id ?? null,
                dealId: props.activity.deal?.id ?? null,
              },
            );
            if (result.activity) {
              props.onSaved?.(result.activity);
            }
            return result;
          }}
          savedMessage={t('saved')}
          submitLabel={t('save')}
          onSaved={() => {
            setEditing(false);
            setEdited(true);
          }}
          onCancel={() => {
            setEditing(false);
            setEdited(true);
          }}
        />
      </li>
    );
  }

  return (
    <li className="flex flex-col gap-1.5 border-t border-rule px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-1.5 text-[0.8125rem] font-medium text-muted-foreground [&_svg]:size-4">
          <ActivityTypeIcon type={props.activity.type} />
          {tType(`type_${props.activity.type}`)}
        </span>
        <time
          dateTime={props.activity.occurredAt}
          className="text-[0.8125rem] text-muted-foreground tabular-nums"
        >
          {formatInstant(props.activity.occurredAt, {
            locale,
            timeZone: props.timeZone,
            withTime: true,
          })}
        </time>
        {props.canEdit && (
          <span className="ml-auto flex items-center gap-0.5">
            <Button
              ref={edited ? focusOnMount : undefined}
              variant="ghost"
              size="icon-sm"
              aria-label={t('edit', { subject: props.activity.subject })}
              onClick={() => {
                setEditing(true);
              }}
            >
              <PencilIcon />
            </Button>
            <ConfirmAction
              trigger={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t('delete', { subject: props.activity.subject })}
                >
                  <Trash2Icon />
                </Button>
              }
              title={t('delete_title', { subject: props.activity.subject })}
              description={t('delete_text')}
              confirmLabel={t('delete_confirm')}
              cancelLabel={t('cancel')}
              fallbackFocus={() =>
                props.headingId
                  ? document.querySelector<HTMLElement>(`#${CSS.escape(props.headingId)}`)
                  : null
              }
              action={async () => {
                const result = await deleteActivity(props.workspaceId, props.activity.id);
                if (result.ok) {
                  props.onDeleted?.(props.activity.id);
                  toast.success(t('deleted'));
                }
                return result;
              }}
            />
          </span>
        )}
      </div>
      {/* Focusable: "Show older" moves the focus to the first activity it added. */}
      <h3
        ref={props.focused && !edited ? focusOnMount : undefined}
        tabIndex={-1}
        className="rounded-sm font-medium break-words"
      >
        {props.activity.subject}
      </h3>
      {props.activity.body && (
        <p className="max-w-[65ch] text-sm break-words whitespace-pre-line">
          {props.activity.body}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="flex items-center gap-2">
          {props.activity.author && <PersonAvatar person={props.activity.author} size="sm" />}
          {props.activity.author
            ? t('by', { name: props.activity.author.displayName ?? props.activity.author.email })
            : t('by_former')}
        </span>
        <LinkedRecords
          record={props.activity}
          workspaceId={props.workspaceId}
          viewed={props.link}
          label={t('on')}
        />
      </div>
    </li>
  );
};

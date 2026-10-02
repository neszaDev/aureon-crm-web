'use client';

import {
  ArchiveIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ForwardIcon,
  MailIcon,
  MailOpenIcon,
  ReplyAllIcon,
  ReplyIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import type { Mail, MailLabel } from './data';
import { MAIL_LABELS } from './data';
import { LabelMenu } from './LabelMenu';
import type { MailAction } from './mailbox';
import { composeHref } from './mailbox';
import { ToolButton, ToolLink } from './ToolButton';

const Group = (props: { children: React.ReactNode }) => (
  <div className="flex items-center rounded-md border border-ink-200 bg-ply shadow-ply">
    {props.children}
  </div>
);

/**
 * The Vue `MailToolbar`, wired to the selected messages: read/unread, star, important, reply,
 * reply all and forward (to compose, prefilled), archive, delete, labels, and previous/next.
 * @param props Component props.
 * @param props.targets The messages the buttons act on.
 * @param props.onAction Called with the action for the targets.
 * @param props.selectAll The select-all box of a list.
 * @param props.selectAll.checked Its state.
 * @param props.selectAll.onToggle Called when it is clicked.
 * @param props.pager Previous/next with a position label.
 * @param props.pager.label Position, e.g. "1–10 of 13".
 * @param props.pager.onPrevious Go back, if possible.
 * @param props.pager.onNext Go forward, if possible.
 * @returns The toolbar.
 */
export const MailToolbar = (props: {
  targets: Mail[];
  onAction: (action: MailAction) => void;
  selectAll?: { checked: boolean | 'indeterminate'; onToggle: () => void };
  pager: { label: string; onPrevious?: () => void; onNext?: () => void };
}) => {
  const t = useTranslations('MailToolbar');
  const none = props.targets.length === 0;
  const allRead = !none && props.targets.every((message) => message.read);
  const allStarred = !none && props.targets.every((message) => message.starred);
  const allImportant = !none && props.targets.every((message) => message.important);
  // Reply, reply all and forward need exactly one message.
  const single = props.targets.length === 1 ? props.targets[0] : undefined;
  const reply = single && {
    to: single.email,
    subject: t('reply_subject', { subject: single.subject }),
  };
  const labels: MailLabel[] = MAIL_LABELS.filter(
    (label) => !none && props.targets.every((message) => message.labels.includes(label)),
  );

  return (
    <div
      role="toolbar"
      aria-label={t('label')}
      className="flex flex-wrap items-center gap-2 border-b border-ink-200 p-3"
    >
      {props.selectAll && (
        <div className="flex size-8 items-center justify-center">
          <Checkbox
            aria-label={t('select_all')}
            checked={props.selectAll.checked}
            onCheckedChange={() => props.selectAll?.onToggle()}
          />
        </div>
      )}
      <Group>
        <ToolButton
          label={allRead ? t('mark_unread') : t('mark_read')}
          disabled={none}
          onClick={() => {
            props.onAction({ type: 'read', value: !allRead });
          }}
        >
          {allRead ? <MailIcon /> : <MailOpenIcon />}
        </ToolButton>
        <ToolButton
          label={t('star')}
          disabled={none}
          pressed={allStarred}
          onClick={() => {
            props.onAction({ type: 'star', value: !allStarred });
          }}
        >
          <StarIcon className={allStarred ? 'fill-current' : undefined} />
        </ToolButton>
        <ToolButton
          label={t('important')}
          disabled={none}
          pressed={allImportant}
          onClick={() => {
            props.onAction({ type: 'important', value: !allImportant });
          }}
        >
          <BookmarkIcon className={allImportant ? 'fill-current' : undefined} />
        </ToolButton>
      </Group>
      <Group>
        <ToolLink label={t('reply')} href={reply && composeHref(reply)}>
          <ReplyIcon />
        </ToolLink>
        <ToolLink label={t('reply_all')} href={reply && composeHref(reply)}>
          <ReplyAllIcon />
        </ToolLink>
        <ToolLink
          label={t('forward')}
          href={
            single && composeHref({ subject: t('forward_subject', { subject: single.subject }) })
          }
        >
          <ForwardIcon />
        </ToolLink>
      </Group>
      <Group>
        <ToolButton
          label={t('archive')}
          disabled={none}
          onClick={() => {
            props.onAction({ type: 'move', box: 'archive' });
          }}
        >
          <ArchiveIcon />
        </ToolButton>
        <ToolButton
          label={t('delete')}
          disabled={none}
          onClick={() => {
            props.onAction({ type: 'move', box: 'trash' });
          }}
        >
          <Trash2Icon />
        </ToolButton>
        <LabelMenu
          checked={labels}
          disabled={none}
          onToggle={(label) => {
            props.onAction({ type: 'label', label, value: !labels.includes(label) });
          }}
        />
      </Group>

      <div className="ml-auto flex items-center gap-2">
        <span className="text-sm text-ink-600 tabular-nums">{props.pager.label}</span>
        <Group>
          <ToolButton
            label={t('previous')}
            disabled={!props.pager.onPrevious}
            onClick={() => props.pager.onPrevious?.()}
          >
            <ChevronLeftIcon />
          </ToolButton>
          <ToolButton
            label={t('next')}
            disabled={!props.pager.onNext}
            onClick={() => props.pager.onNext?.()}
          >
            <ChevronRightIcon />
          </ToolButton>
        </Group>
      </div>
    </div>
  );
};

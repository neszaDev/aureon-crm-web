'use client';

import { cn } from 'cn';
import { InboxIcon, PaperclipIcon, StarIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from '@/libs/I18nNavigation';
import type { Mail, MailFolder, MailLabel } from './data';
import { EmailFrame } from './EmailFrame';
import { LabelTags } from './LabelMenu';
import type { MailAction } from './mailbox';
import { folderMessages, labelMessages } from './mailbox';
import { useMailbox } from './MailboxProvider';
import { MailToolbar } from './MailToolbar';

const PAGE_SIZE = 10;

/**
 * The Vue inbox: the toolbar over a list of messages (unread ones in bold), with a checkbox
 * and a star on each row, ten rows per page.
 * @param props Component props.
 * @param props.folder The folder to list.
 * @param props.label List a label's messages instead of the folder.
 * @returns The inbox.
 */
export const InboxView = (props: { folder: MailFolder; label?: MailLabel }) => {
  const t = useTranslations('InboxPage');
  const tNav = useTranslations('EmailNav');
  const format = useFormatter();
  const mailbox = useMailbox();
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const list = props.label
    ? labelMessages(mailbox.messages, props.label)
    : folderMessages(mailbox.messages, props.folder);
  const pages = Math.max(Math.ceil(list.length / PAGE_SIZE), 1);
  const current = Math.min(page, pages - 1);
  const visible = list.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);
  const targets = list.filter((message) => selected.includes(message.id));
  const allVisible =
    visible.length > 0 && visible.every((message) => selected.includes(message.id));
  const someVisible = visible.some((message) => selected.includes(message.id));
  const title = props.label ? tNav(`label_${props.label}`) : tNav(`folder_${props.folder}`);

  const onAction = (action: MailAction) => {
    const ids = targets.map((message) => message.id);
    mailbox.apply(ids, action);
    if (action.type !== 'move') {
      return;
    }
    setSelected([]);
    if (action.box === 'archive') {
      toast.success(t('archived', { count: ids.length }));
    } else if (props.folder === 'trash' && !props.label) {
      toast.success(t('deleted', { count: ids.length }));
    } else {
      toast.success(t('trashed', { count: ids.length }));
    }
  };
  const toggle = (message: Mail, value: boolean) => {
    setSelected((ids) => (value ? [...ids, message.id] : ids.filter((id) => id !== message.id)));
  };

  return (
    <EmailFrame folder={props.label ? undefined : props.folder} label={props.label}>
      <h2 className="sr-only">{title}</h2>
      <MailToolbar
        targets={targets}
        onAction={onAction}
        selectAll={{
          checked: allVisible ? true : someVisible && 'indeterminate',
          onToggle: () => {
            setSelected((ids) =>
              allVisible
                ? ids.filter((id) => !visible.some((message) => message.id === id))
                : [...new Set([...ids, ...visible.map((message) => message.id)])],
            );
          },
        }}
        pager={{
          label:
            list.length === 0
              ? t('range_empty')
              : t('range', {
                  from: current * PAGE_SIZE + 1,
                  to: current * PAGE_SIZE + visible.length,
                  total: list.length,
                }),
          onPrevious:
            current > 0
              ? () => {
                  setPage(current - 1);
                }
              : undefined,
          onNext:
            current < pages - 1
              ? () => {
                  setPage(current + 1);
                }
              : undefined,
        }}
      />

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
          <InboxIcon aria-hidden="true" className="size-6 text-ink-400" />
          <p className="font-semibold text-ink-950">{t('empty_title')}</p>
          <p className="text-[0.9375rem] text-ink-600">{t('empty_text', { folder: title })}</p>
        </div>
      ) : (
        <ul aria-label={title}>
          {visible.map((message) => {
            const outgoing = message.box === 'sent' || message.box === 'drafts';
            const checked = selected.includes(message.id);

            return (
              <li
                key={message.id}
                data-state={checked ? 'selected' : undefined}
                className="flex items-start gap-1 border-b border-ink-200 px-3 py-2.5 transition-colors last:border-b-0 hover:bg-ink-100/60 data-[state=selected]:bg-ink-100"
              >
                <div className="flex size-8 shrink-0 items-center justify-center">
                  <Checkbox
                    aria-label={t('select_message', { subject: message.subject })}
                    checked={checked}
                    onCheckedChange={(value) => {
                      toggle(message, value === true);
                    }}
                  />
                </div>
                <button
                  type="button"
                  aria-label={t('star_message', { subject: message.subject })}
                  aria-pressed={message.starred}
                  onClick={() => {
                    mailbox.apply([message.id], { type: 'star', value: !message.starred });
                  }}
                  className="flex size-8 shrink-0 items-center justify-center rounded-md text-ink-400 hover:bg-ink-100 hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-pressed:text-folder"
                >
                  <StarIcon className={cn('size-4', message.starred && 'fill-current')} />
                </button>
                <Link
                  href={`/dashboard/apps/email/message?id=${message.id}&folder=${props.folder}`}
                  onClick={() => {
                    mailbox.apply([message.id], { type: 'read', value: true });
                  }}
                  className="grid min-w-0 flex-1 gap-0.5 rounded-sm px-1 py-0.5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span
                      className={cn(
                        'flex min-w-0 items-center gap-2 truncate',
                        message.read ? 'text-ink-700' : 'font-bold text-ink-950',
                      )}
                    >
                      {!message.read && (
                        <>
                          <span
                            aria-hidden="true"
                            className="size-2 shrink-0 rounded-full bg-folder"
                          />
                          <span className="sr-only">{t('unread')}</span>
                        </>
                      )}
                      <span className="truncate">
                        {outgoing
                          ? t('to', {
                              to:
                                message.to === undefined || message.to === ''
                                  ? t('no_recipient')
                                  : message.to,
                            })
                          : message.from}
                      </span>
                    </span>
                    <time
                      dateTime={message.sentAt}
                      className="shrink-0 text-xs text-ink-600 tabular-nums"
                    >
                      {format.dateTime(new Date(message.sentAt), {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'UTC',
                      })}
                    </time>
                  </span>
                  <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={cn(
                        'truncate text-[0.9375rem]',
                        message.read ? 'text-ink-900' : 'font-semibold text-ink-950',
                      )}
                    >
                      {message.subject}
                    </span>
                    {message.attachments.length > 0 && (
                      <>
                        <PaperclipIcon
                          aria-hidden="true"
                          className="size-3.5 shrink-0 text-ink-600"
                        />
                        <span className="sr-only">{t('has_attachments')}</span>
                      </>
                    )}
                    <LabelTags labels={message.labels} />
                  </span>
                  <span className="line-clamp-1 text-sm text-ink-600">{message.body[0]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </EmailFrame>
  );
};

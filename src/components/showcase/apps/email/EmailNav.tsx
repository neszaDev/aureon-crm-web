'use client';

import { cn } from 'cn';
import {
  ArchiveIcon,
  BookmarkIcon,
  FileTextIcon,
  InboxIcon,
  SendIcon,
  ShieldAlertIcon,
  SquarePenIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';
import type { MailFolder, MailLabel } from './data';
import { LABEL_DOT, MAIL_FOLDERS, MAIL_LABELS } from './data';
import { folderCount } from './mailbox';
import { useMailbox } from './MailboxProvider';

const FOLDER_ICONS: Record<MailFolder, LucideIcon> = {
  inbox: InboxIcon,
  starred: StarIcon,
  sent: SendIcon,
  drafts: FileTextIcon,
  archive: ArchiveIcon,
  trash: Trash2Icon,
  important: BookmarkIcon,
  spam: ShieldAlertIcon,
};

const itemClass = (current: boolean) =>
  cn(
    'flex h-9 shrink-0 items-center gap-2.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors',
    current ? 'bg-ink-100 text-ink-950' : 'text-ink-700 hover:bg-ink-100/60 hover:text-ink-900',
  );

/**
 * The mail sidebar (Vue `EmailNav`): a new-email button, the folders with their unread counts,
 * and the labels. A row that scrolls sideways on phones, a column from `lg`.
 * @param props Component props.
 * @param props.folder The open folder, if any.
 * @param props.label The open label, if any.
 * @returns The navigation.
 */
export const EmailNav = (props: { folder?: MailFolder; label?: MailLabel }) => {
  const t = useTranslations('EmailNav');
  const { messages } = useMailbox();

  return (
    <nav aria-label={t('label')} className="flex min-w-0 flex-col gap-4">
      <Button asChild className="self-start lg:self-stretch">
        <Link href="/dashboard/apps/email/compose">
          <SquarePenIcon data-icon="inline-start" />
          {t('new_email')}
        </Link>
      </Button>

      <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible">
        {MAIL_FOLDERS.map((folder) => {
          const Icon = FOLDER_ICONS[folder];
          const count = folderCount(messages, folder);
          const current = props.folder === folder;

          return (
            <li key={folder}>
              <Link
                href={`/dashboard/apps/email/inbox?folder=${folder}`}
                aria-current={current ? 'page' : undefined}
                className={itemClass(current)}
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span className="flex-1">{t(`folder_${folder}`)}</span>
                {count > 0 && (
                  <Badge
                    variant={folder === 'inbox' ? 'default' : 'outline'}
                    className="tabular-nums"
                    aria-label={t('count', { count })}
                  >
                    {count}
                  </Badge>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2">
        <h2 className="px-3 text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-600 uppercase">
          {t('labels_title')}
        </h2>
        <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 lg:flex-col lg:overflow-visible">
          {MAIL_LABELS.map((label) => (
            <li key={label}>
              <Link
                href={`/dashboard/apps/email/inbox?label=${label}`}
                aria-current={props.label === label ? 'page' : undefined}
                className={itemClass(props.label === label)}
              >
                <span
                  aria-hidden="true"
                  className={cn('size-2.5 rounded-full', LABEL_DOT[label])}
                />
                {t(`label_${label}`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

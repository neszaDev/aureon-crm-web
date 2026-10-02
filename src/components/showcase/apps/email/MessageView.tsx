'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeftIcon, DownloadIcon, EyeIcon, MailQuestionIcon, Share2Icon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { FieldError } from '@/components/FieldError';
import { describedBy } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Link, useRouter } from '@/libs/I18nNavigation';
import type { Mail, MailFolder } from './data';
import { EmailFrame } from './EmailFrame';
import { LabelTags } from './LabelMenu';
import type { MailAction } from './mailbox';
import { folderMessages, outgoingMail } from './mailbox';
import { useMailbox } from './MailboxProvider';
import { MailToolbar } from './MailToolbar';

const ReplyValidation = z.object({ reply: z.string().trim().min(1, 'required') });

type ReplyValues = z.infer<typeof ReplyValidation>;

/**
 * The reply box under a message: sending it files the reply under Sent.
 * @param props Component props.
 * @param props.message The message being answered.
 * @returns The reply form.
 */
const ReplyForm = (props: { message: Mail }) => {
  const t = useTranslations('MessagePage');
  const tToolbar = useTranslations('MailToolbar');
  const mailbox = useMailbox();
  const form = useForm<ReplyValues>({
    resolver: zodResolver(ReplyValidation),
    defaultValues: { reply: '' },
  });
  const error = form.formState.errors.reply;

  return (
    <form
      noValidate
      className="flex flex-col gap-3"
      onSubmit={form.handleSubmit((values) => {
        mailbox.add(
          outgoingMail({
            id: crypto.randomUUID(),
            sentAt: new Date().toISOString(),
            to: props.message.email,
            subject: tToolbar('reply_subject', { subject: props.message.subject }),
            text: values.reply,
            box: 'sent',
          }),
        );
        form.reset();
        toast.success(t('reply_sent'));
      })}
    >
      <Label htmlFor="reply" className="sr-only">
        {t('reply_label')}
      </Label>
      <Textarea
        id="reply"
        rows={8}
        placeholder={t('reply_placeholder')}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? describedBy('reply') : undefined}
        {...form.register('reply')}
      />
      <FieldError error={error} id={describedBy('reply')} />
      <Button type="submit" className="self-start">
        {t('send_reply')}
      </Button>
    </form>
  );
};

/**
 * The Vue message view: the toolbar (acting on this message, previous/next within the
 * folder), the headers, body, attachments and a reply box.
 * @param props Component props.
 * @param props.id The message to show; the folder's newest message when absent.
 * @param props.folder The folder the message was opened from.
 * @returns The message.
 */
export const MessageView = (props: { id?: string; folder: MailFolder }) => {
  const t = useTranslations('MessagePage');
  const tNav = useTranslations('EmailNav');
  const format = useFormatter();
  const router = useRouter();
  const mailbox = useMailbox();
  const list = folderMessages(mailbox.messages, props.folder);
  const message = props.id
    ? mailbox.messages.find((candidate) => candidate.id === props.id)
    : list[0];
  const folderHref = `/dashboard/apps/email/inbox?folder=${props.folder}`;

  if (!message) {
    return (
      <EmailFrame folder={props.folder}>
        <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <MailQuestionIcon aria-hidden="true" className="size-6 text-ink-400" />
          <h2 className="font-semibold text-ink-950">{t('not_found_title')}</h2>
          <p className="text-[0.9375rem] text-ink-600">{t('not_found_text')}</p>
          <Button asChild variant="outline">
            <Link href={folderHref}>
              <ArrowLeftIcon data-icon="inline-start" />
              {t('back_to_folder', { folder: tNav(`folder_${props.folder}`) })}
            </Link>
          </Button>
        </div>
      </EmailFrame>
    );
  }

  const index = list.findIndex((candidate) => candidate.id === message.id);
  const open = (target: Mail | undefined) =>
    target
      ? () => {
          mailbox.apply([target.id], { type: 'read', value: true });
          router.push(`/dashboard/apps/email/message?id=${target.id}&folder=${props.folder}`);
        }
      : undefined;
  const onAction = (action: MailAction) => {
    mailbox.apply([message.id], action);
    if (action.type === 'move') {
      if (action.box === 'archive') {
        toast.success(t('archived'));
      } else {
        toast.success(message.box === 'trash' ? t('deleted') : t('trashed'));
      }
      router.push(folderHref);
    }
  };
  const sentAt = new Date(message.sentAt);

  return (
    <EmailFrame folder={props.folder}>
      <MailToolbar
        targets={[message]}
        onAction={onAction}
        pager={{
          label: index === -1 ? '' : t('position', { index: index + 1, total: list.length }),
          onPrevious: index > 0 ? open(list[index - 1]) : undefined,
          onNext: index !== -1 && index < list.length - 1 ? open(list[index + 1]) : undefined,
        }}
      />

      <article className="flex flex-col gap-6 p-5">
        <header className="flex flex-col gap-2 border-b border-ink-200 pb-5">
          <h2 className="text-xl font-bold tracking-[-0.01em] text-ink-950">{message.subject}</h2>
          <LabelTags labels={message.labels} />
          <p className="flex flex-wrap items-baseline gap-x-2 text-[0.9375rem]">
            <span className="font-semibold text-ink-950">{message.from}</span>
            <span className="text-ink-600">{message.email}</span>
          </p>
          {message.to && <p className="text-sm text-ink-600">{t('to', { to: message.to })}</p>}
          <time dateTime={message.sentAt} className="text-sm text-ink-600 tabular-nums">
            {t.rich('sent_at', {
              day: format.dateTime(sentAt, { dateStyle: 'full', timeZone: 'UTC' }),
              time: format.dateTime(sentAt, { timeStyle: 'short', timeZone: 'UTC' }),
              strong: (chunks) => <strong className="font-semibold text-ink-900">{chunks}</strong>,
            })}
          </time>
        </header>

        <div className="flex max-w-prose flex-col gap-4 text-[0.9375rem] leading-relaxed text-ink-900">
          {message.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {message.quote && (
            <blockquote className="border-l-2 border-ink-300 pl-4 text-ink-600">
              {message.quote}
            </blockquote>
          )}
        </div>

        {message.attachments.length > 0 && (
          <section aria-labelledby="attachments-heading" className="flex flex-col gap-2">
            <h3
              id="attachments-heading"
              className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-600 uppercase"
            >
              {t('attachments', { count: message.attachments.length })}
            </h3>
            <ul className="flex flex-col divide-y divide-ink-200 rounded-sm border border-ink-200">
              {message.attachments.map((file) => (
                <li
                  key={file.name}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2"
                >
                  <span className="inline-flex h-5 items-center rounded-sm border border-ink-300 bg-ply px-1.5 text-[0.6875rem] font-semibold tracking-[0.08em] text-ink-700 uppercase">
                    {file.kind}
                  </span>
                  <span className="font-semibold text-ink-950">{file.name}</span>
                  <span className="text-sm text-ink-600 tabular-nums">
                    {file.sizeKb >= 1024
                      ? format.number(file.sizeKb / 1024, {
                          style: 'unit',
                          unit: 'megabyte',
                          maximumFractionDigits: 1,
                        })
                      : format.number(file.sizeKb, { style: 'unit', unit: 'kilobyte' })}
                  </span>
                  <span className="ml-auto flex">
                    {[
                      {
                        key: 'preview',
                        icon: <EyeIcon />,
                        label: t('preview', { name: file.name }),
                      },
                      {
                        key: 'share',
                        icon: <Share2Icon />,
                        label: t('share', { name: file.name }),
                      },
                      {
                        key: 'download',
                        icon: <DownloadIcon />,
                        label: t('download', { name: file.name }),
                      },
                    ].map((action) => (
                      <Button
                        key={action.key}
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={action.label}
                        onClick={() => toast.info(t('attachment_unavailable', { name: file.name }))}
                      >
                        {action.icon}
                      </Button>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <ReplyForm key={message.id} message={message} />
      </article>
    </EmailFrame>
  );
};

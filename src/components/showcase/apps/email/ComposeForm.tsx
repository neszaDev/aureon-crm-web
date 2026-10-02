'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import {
  BoldIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  PaperclipIcon,
  SendIcon,
  Trash2Icon,
  UnderlineIcon,
  XIcon,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { FieldError } from '@/components/FieldError';
import { describedBy } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComposeValues } from './composeValidation';
import { ComposeValidation, splitAddresses } from './composeValidation';
import type { MailAttachment, MailLabel } from './data';
import { EmailFrame } from './EmailFrame';
import { LabelMenu, LabelTags } from './LabelMenu';
import { outgoingMail } from './mailbox';
import { useMailbox } from './MailboxProvider';
import { ToolButton } from './ToolButton';

const RECIPIENT_FIELDS = ['to', 'cc', 'bcc'] as const;

const toAttachment = (file: File): MailAttachment => ({
  name: file.name,
  kind: file.name.includes('.') ? (file.name.split('.').pop() ?? 'file') : 'file',
  sizeKb: Math.max(Math.round(file.size / 1024), 1),
});

/**
 * The Vue compose view: recipients, subject, a rich-text body with its formatting toolbar,
 * attachments and labels, then send (to Sent), save as draft (to Drafts) or discard.
 * @param props Component props.
 * @param props.defaultTo Recipient to start with (a reply).
 * @param props.defaultSubject Subject to start with (a reply or a forward).
 * @returns The compose form.
 */
export const ComposeForm = (props: { defaultTo?: string; defaultSubject?: string }) => {
  const t = useTranslations('ComposePage');
  const format = useFormatter();
  const mailbox = useMailbox();
  const fileInput = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [labels, setLabels] = useState<MailLabel[]>([]);
  const form = useForm<ComposeValues>({
    resolver: zodResolver(ComposeValidation),
    defaultValues: {
      to: props.defaultTo ?? '',
      cc: '',
      bcc: '',
      subject: props.defaultSubject ?? '',
    },
  });
  const { errors } = form.formState;
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
      }),
    ],
    // Rendered on the server too: create the editor after hydration.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        'aria-labelledby': 'compose-body-label',
        'aria-multiline': 'true',
        role: 'textbox',
        class:
          'min-h-64 px-3 py-2 text-[0.9375rem] leading-relaxed text-ink-900 outline-none [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-6',
      },
    },
  });
  const marks = useEditorState({
    editor,
    selector: (snapshot) => ({
      bold: snapshot.editor?.isActive('bold') ?? false,
      italic: snapshot.editor?.isActive('italic') ?? false,
      underline: snapshot.editor?.isActive('underline') ?? false,
      bulletList: snapshot.editor?.isActive('bulletList') ?? false,
      orderedList: snapshot.editor?.isActive('orderedList') ?? false,
      canIndent: snapshot.editor?.can().sinkListItem('listItem') ?? false,
      canOutdent: snapshot.editor?.can().liftListItem('listItem') ?? false,
    }),
  });

  const clear = () => {
    form.reset({ to: '', cc: '', bcc: '', subject: '' });
    editor?.commands.clearContent();
    setFiles([]);
    setLabels([]);
  };
  const file = (box: 'sent' | 'drafts', values: ComposeValues) => {
    mailbox.add(
      outgoingMail({
        id: crypto.randomUUID(),
        sentAt: new Date().toISOString(),
        to: splitAddresses(values.to).join(', '),
        subject: values.subject.trim() === '' ? t('no_subject') : values.subject.trim(),
        text: editor?.getText({ blockSeparator: '\n\n' }) ?? '',
        box,
        labels,
        attachments: files.map(toAttachment),
      }),
    );
  };
  const field = (name: (typeof RECIPIENT_FIELDS)[number] | 'subject') => ({
    id: `compose-${name}`,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? describedBy(`compose-${name}`) : undefined,
    ...form.register(name),
  });
  return (
    <EmailFrame>
      <form
        noValidate
        className="flex flex-col gap-5 p-5"
        aria-labelledby="compose-heading"
        onSubmit={form.handleSubmit((values) => {
          file('sent', values);
          clear();
          toast.success(t('sent'));
        })}
      >
        <h2 id="compose-heading" className="text-lg font-semibold text-ink-950">
          {t('heading')}
        </h2>

        <div className="flex flex-col gap-3">
          {[...RECIPIENT_FIELDS, 'subject' as const].map((name) => (
            <div key={name} className="grid gap-2 sm:grid-cols-[5rem_minmax(0,1fr)] sm:items-start">
              <Label htmlFor={`compose-${name}`} className="sm:h-10">
                {t(`${name}_label`)}
              </Label>
              <div className="flex flex-col gap-1.5">
                <Input
                  type={name === 'subject' ? 'text' : 'email'}
                  multiple={name !== 'subject'}
                  autoComplete={name === 'subject' ? 'off' : 'email'}
                  placeholder={t(`${name}_placeholder`)}
                  {...field(name)}
                />
                <FieldError error={errors[name]} id={describedBy(`compose-${name}`)} />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span
            id="compose-body-label"
            className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-700 uppercase"
          >
            {t('body_label')}
          </span>
          <div className="overflow-hidden rounded-md border border-input bg-ply shadow-ply transition-[border-color,box-shadow] focus-within:border-folder focus-within:ring-3 focus-within:ring-folder/20">
            <div
              role="toolbar"
              aria-label={t('toolbar_label')}
              className="flex flex-wrap items-center gap-1 border-b border-ink-200 px-1.5 py-1"
            >
              <ToolButton
                label={t('bold')}
                disabled={!editor}
                pressed={marks?.bold}
                onClick={() => editor?.chain().focus().toggleBold().run()}
              >
                <BoldIcon />
              </ToolButton>
              <ToolButton
                label={t('italic')}
                disabled={!editor}
                pressed={marks?.italic}
                onClick={() => editor?.chain().focus().toggleItalic().run()}
              >
                <ItalicIcon />
              </ToolButton>
              <ToolButton
                label={t('underline')}
                disabled={!editor}
                pressed={marks?.underline}
                onClick={() => editor?.chain().focus().toggleUnderline().run()}
              >
                <UnderlineIcon />
              </ToolButton>
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-ink-200" />
              <ToolButton
                label={t('bullet_list')}
                disabled={!editor}
                pressed={marks?.bulletList}
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
              >
                <ListIcon />
              </ToolButton>
              <ToolButton
                label={t('ordered_list')}
                disabled={!editor}
                pressed={marks?.orderedList}
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              >
                <ListOrderedIcon />
              </ToolButton>
              <ToolButton
                label={t('indent')}
                disabled={!marks?.canIndent}
                onClick={() => editor?.chain().focus().sinkListItem('listItem').run()}
              >
                <IndentIncreaseIcon />
              </ToolButton>
              <ToolButton
                label={t('outdent')}
                disabled={!marks?.canOutdent}
                onClick={() => editor?.chain().focus().liftListItem('listItem').run()}
              >
                <IndentDecreaseIcon />
              </ToolButton>
              <span aria-hidden="true" className="mx-1 h-5 w-px bg-ink-200" />
              <ToolButton
                label={t('clear_body')}
                disabled={!editor}
                onClick={() => editor?.chain().focus().clearContent().run()}
              >
                <Trash2Icon />
              </ToolButton>
              <ToolButton label={t('attach')} onClick={() => fileInput.current?.click()}>
                <PaperclipIcon />
              </ToolButton>
              <LabelMenu
                checked={labels}
                onToggle={(label) => {
                  setLabels((current) =>
                    current.includes(label)
                      ? current.filter((item) => item !== label)
                      : [...current, label],
                  );
                }}
              />
            </div>
            <EditorContent editor={editor} />
          </div>
        </div>

        <input
          ref={fileInput}
          type="file"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label={t('attach')}
          onChange={(event) => {
            const picked = [...(event.currentTarget.files ?? [])];
            setFiles((current) => [...current, ...picked]);
            // Let the same file be picked again after removing it.
            event.currentTarget.value = '';
          }}
        />

        {(files.length > 0 || labels.length > 0) && (
          <div className="flex flex-col gap-3">
            <LabelTags labels={labels} />
            {files.length > 0 && (
              <ul aria-label={t('attachments_label')} className="flex flex-col gap-1">
                {files.map((attached, index) => (
                  <li
                    key={`${attached.name}-${attached.lastModified}-${attached.size}`}
                    className="flex items-center gap-2 text-sm"
                  >
                    <PaperclipIcon aria-hidden="true" className="size-3.5 text-ink-600" />
                    <span className="truncate font-medium text-ink-950">{attached.name}</span>
                    <span className="text-ink-600 tabular-nums">
                      {format.number(toAttachment(attached).sizeKb, {
                        style: 'unit',
                        unit: 'kilobyte',
                      })}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label={t('remove_attachment', { name: attached.name })}
                      onClick={() => {
                        setFiles((current) => current.filter((_, position) => position !== index));
                      }}
                    >
                      <XIcon />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit">
            <SendIcon data-icon="inline-start" />
            {t('send')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              file('drafts', form.getValues());
              clear();
              toast.success(t('draft_saved'));
            }}
          >
            {t('draft')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              clear();
              toast(t('discarded'));
            }}
          >
            {t('discard')}
          </Button>
        </div>
      </form>
    </EmailFrame>
  );
};

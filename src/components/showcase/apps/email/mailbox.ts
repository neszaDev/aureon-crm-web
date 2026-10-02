import type { Mail, MailAttachment, MailBox, MailFolder, MailLabel } from './data';
import { MAIL_FOLDERS, ME } from './data';

/** A change applied to the selected messages. */
export type MailAction =
  | { type: 'read'; value: boolean }
  | { type: 'star'; value: boolean }
  | { type: 'important'; value: boolean }
  | { type: 'label'; label: MailLabel; value: boolean }
  | { type: 'move'; box: MailBox }
  | { type: 'delete' };

/**
 * Narrows a `?folder=` value to a known folder.
 * @param value The raw value.
 * @returns The folder, or `inbox` for anything else.
 */
export const toFolder = (value: string | undefined): MailFolder =>
  MAIL_FOLDERS.find((folder) => folder === value) ?? 'inbox';

const inFolder = (message: Mail, folder: MailFolder) => {
  if (folder === 'starred') {
    return message.starred && message.box !== 'trash' && message.box !== 'spam';
  }
  if (folder === 'important') {
    return message.important && message.box !== 'trash' && message.box !== 'spam';
  }
  return message.box === folder;
};

/**
 * The messages of a folder, newest first.
 * @param messages Every message.
 * @param folder The folder.
 * @returns The folder's messages.
 */
export const folderMessages = (messages: Mail[], folder: MailFolder) =>
  messages
    .filter((message) => inFolder(message, folder))
    .toSorted((a, b) => b.sentAt.localeCompare(a.sentAt));

/**
 * A sidebar count: the unread messages of a folder, or every draft for Drafts.
 * @param messages Every message.
 * @param folder The folder.
 * @returns The count.
 */
export const folderCount = (messages: Mail[], folder: MailFolder) =>
  folderMessages(messages, folder).filter((message) => folder === 'drafts' || !message.read).length;

const updateMessage = (message: Mail, action: Exclude<MailAction, { type: 'delete' }>) => {
  if (action.type === 'read') {
    return [{ ...message, read: action.value }];
  }
  if (action.type === 'star') {
    return [{ ...message, starred: action.value }];
  }
  if (action.type === 'important') {
    return [{ ...message, important: action.value }];
  }
  if (action.type === 'label') {
    const others = message.labels.filter((label) => label !== action.label);
    return [{ ...message, labels: action.value ? [...others, action.label] : others }];
  }
  // Moving to the trash from the trash deletes for good.
  return action.box === 'trash' && message.box === 'trash' ? [] : [{ ...message, box: action.box }];
};

/**
 * Applies a toolbar action to some messages. Moving to trash what is already in the trash
 * deletes it for good.
 * @param messages Every message.
 * @param ids Ids of the messages to change.
 * @param action The change.
 * @returns The updated messages.
 */
export const applyMailAction = (messages: Mail[], ids: string[], action: MailAction) => {
  const targets = new Set(ids);
  if (action.type === 'delete') {
    return messages.filter((message) => !targets.has(message.id));
  }

  return messages.flatMap((message) =>
    targets.has(message.id) ? updateMessage(message, action) : [message],
  );
};

/**
 * The messages carrying a label, newest first (trash and spam left out).
 * @param messages Every message.
 * @param label The label.
 * @returns The labelled messages.
 */
export const labelMessages = (messages: Mail[], label: MailLabel) =>
  messages
    .filter(
      (message) =>
        message.labels.includes(label) && message.box !== 'trash' && message.box !== 'spam',
    )
    .toSorted((a, b) => b.sentAt.localeCompare(a.sentAt));

/**
 * The compose page, prefilled (for a reply or a forward).
 * @param prefill Fields to prefill.
 * @param prefill.to Recipient.
 * @param prefill.subject Subject.
 * @returns The compose URL.
 */
export const composeHref = (prefill: { to?: string; subject?: string }) => {
  const search = new URLSearchParams();
  if (prefill.to) {
    search.set('to', prefill.to);
  }
  if (prefill.subject) {
    search.set('subject', prefill.subject);
  }
  const query = search.toString();
  return query ? `/dashboard/apps/email/compose?${query}` : '/dashboard/apps/email/compose';
};

/**
 * A message written here (a reply, a sent message or a draft), from the mailbox owner.
 * @param draft The written message.
 * @param draft.id New message id.
 * @param draft.sentAt ISO time it was written.
 * @param draft.to Recipients.
 * @param draft.subject Subject.
 * @param draft.text Body text; blank lines separate paragraphs.
 * @param draft.box `sent` or `drafts`.
 * @param draft.labels Labels chosen while writing.
 * @param draft.attachments Attached files.
 * @returns The message.
 */
export const outgoingMail = (draft: {
  id: string;
  sentAt: string;
  to: string;
  subject: string;
  text: string;
  box: 'sent' | 'drafts';
  labels?: MailLabel[];
  attachments?: MailAttachment[];
}): Mail => ({
  id: draft.id,
  from: ME.name,
  email: ME.email,
  to: draft.to,
  sentAt: draft.sentAt,
  subject: draft.subject,
  body: draft.text
    .split(/\n\s*\n/u)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean),
  read: true,
  starred: false,
  important: false,
  box: draft.box,
  labels: draft.labels ?? [],
  attachments: draft.attachments ?? [],
});

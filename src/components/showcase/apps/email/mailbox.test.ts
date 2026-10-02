import { describe, expect, it } from 'vitest';
import type { Mail } from './data';
import { MAILS } from './data';
import {
  applyMailAction,
  composeHref,
  folderCount,
  folderMessages,
  outgoingMail,
  toFolder,
} from './mailbox';

const base: Mail = {
  id: 'a',
  from: 'Ada',
  email: 'ada@example.com',
  sentAt: '2026-01-02T00:00:00Z',
  subject: 'Hello',
  body: ['Hi'],
  read: false,
  starred: false,
  important: false,
  box: 'inbox',
  labels: [],
  attachments: [],
};
const older: Mail = { ...base, id: 'b', sentAt: '2026-01-01T00:00:00Z', read: true };

describe(folderCount, () => {
  it('counts the four unread inbox messages of the Vue sample', () => {
    expect(folderCount(MAILS, 'inbox')).toBe(4);
  });

  it('counts every draft, read or not', () => {
    expect(folderCount([{ ...older, box: 'drafts' }], 'drafts')).toBe(1);
  });
});

describe(folderMessages, () => {
  it('lists a folder newest first', () => {
    expect(folderMessages([older, base], 'inbox').map((m) => m.id)).toStrictEqual(['a', 'b']);
  });

  it('leaves trashed messages out of the starred folder', () => {
    const trashed = { ...base, starred: true, box: 'trash' as const };

    expect(folderMessages([trashed], 'starred')).toStrictEqual([]);
  });
});

describe(applyMailAction, () => {
  it('marks only the selected messages as read', () => {
    const result = applyMailAction([base, older], ['a'], { type: 'read', value: true });

    expect(result.map((m) => m.read)).toStrictEqual([true, true]);
  });

  it('adds a label once and removes it again', () => {
    const added = applyMailAction([base], ['a'], { type: 'label', label: 'job', value: true });
    const again = applyMailAction(added, ['a'], { type: 'label', label: 'job', value: true });
    const removed = applyMailAction(again, ['a'], { type: 'label', label: 'job', value: false });

    expect(again[0]?.labels).toStrictEqual(['job']);
    expect(removed[0]?.labels).toStrictEqual([]);
  });

  it('moves to the trash, then deletes from the trash for good', () => {
    const trashed = applyMailAction([base], ['a'], { type: 'move', box: 'trash' });

    expect(trashed[0]?.box).toBe('trash');
    expect(applyMailAction(trashed, ['a'], { type: 'move', box: 'trash' })).toStrictEqual([]);
  });
});

describe(toFolder, () => {
  it('falls back to the inbox for unknown folders', () => {
    expect(toFolder('starred')).toBe('starred');
    expect(toFolder('nope')).toBe('inbox');
  });
});

describe(composeHref, () => {
  it('encodes the prefilled recipient and subject', () => {
    expect(composeHref({ to: 'ada@example.com', subject: 'Re: A & B' })).toBe(
      '/dashboard/apps/email/compose?to=ada%40example.com&subject=Re%3A+A+%26+B',
    );
  });

  it('links to an empty form without prefill', () => {
    expect(composeHref({})).toBe('/dashboard/apps/email/compose');
  });
});

describe(outgoingMail, () => {
  it('splits the text into paragraphs at blank lines', () => {
    const message = outgoingMail({
      id: 'x',
      sentAt: '2026-01-01T00:00:00Z',
      to: 'ada@example.com',
      subject: 'Hi',
      text: 'First line\nsame paragraph\n\n  Second  \n\n\n',
      box: 'sent',
    });

    expect(message.body).toStrictEqual(['First line\nsame paragraph', 'Second']);
    expect(message.box).toBe('sent');
  });
});

'use client';

import { createContext, use, useState } from 'react';
import type { Mail } from './data';
import { MAILS } from './data';
import type { MailAction } from './mailbox';
import { applyMailAction } from './mailbox';

type SetMessages = React.Dispatch<React.SetStateAction<Mail[]>>;

const MessagesContext = createContext<Mail[] | null>(null);
const SetMessagesContext = createContext<SetMessages | null>(null);

/**
 * Holds the sample mailbox for the email pages, so changes (read, starred, moved, sent) carry
 * over between the inbox, a message and compose until the page reloads.
 * @param props Component props.
 * @param props.children The email pages.
 * @returns The provider.
 */
export const MailboxProvider = (props: { children: React.ReactNode }) => {
  const [messages, setMessages] = useState(MAILS);

  return (
    <SetMessagesContext value={setMessages}>
      <MessagesContext value={messages}>{props.children}</MessagesContext>
    </SetMessagesContext>
  );
};

/**
 * The sample mailbox and its actions.
 * @returns The messages, `apply` (a toolbar action on some ids) and `add` (a new message).
 * @throws {Error} When used outside {@link MailboxProvider}.
 */
export const useMailbox = () => {
  const messages = use(MessagesContext);
  const setMessages = use(SetMessagesContext);
  if (!messages || !setMessages) {
    throw new Error('useMailbox must be used inside MailboxProvider');
  }

  return {
    messages,
    apply: (ids: string[], action: MailAction) => {
      setMessages((current) => applyMailAction(current, ids, action));
    },
    add: (message: Mail) => {
      setMessages((current) => [message, ...current]);
    },
  };
};

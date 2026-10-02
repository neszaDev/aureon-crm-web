import { MailboxProvider } from '@/components/showcase/apps/email/MailboxProvider';
import { Toaster } from '@/components/ui/sonner';

/**
 * Keeps one sample mailbox (and one toaster) across the inbox, message and compose pages.
 * @param props Layout props.
 * @param props.children The email page.
 * @returns The email pages with their shared mailbox.
 */
export default function EmailLayout(props: { children: React.ReactNode }) {
  return (
    <MailboxProvider>
      {props.children}
      <Toaster position="bottom-right" />
    </MailboxProvider>
  );
}

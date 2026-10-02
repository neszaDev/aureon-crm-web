import type { MailFolder, MailLabel } from './data';
import { EmailNav } from './EmailNav';

/**
 * The email app layout (Vue `c-email-app`): the mail sidebar beside the open view, stacked on
 * phones.
 * @param props Component props.
 * @param props.folder The open folder, if any.
 * @param props.label The open label, if any.
 * @param props.children The open view.
 * @returns The layout.
 */
export const EmailFrame = (props: {
  folder?: MailFolder;
  label?: MailLabel;
  children: React.ReactNode;
}) => (
  <div className="grid items-start gap-6 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
    <EmailNav folder={props.folder} label={props.label} />
    <div className="min-w-0 overflow-hidden rounded-sm border border-ink-200 bg-card shadow-sheet">
      {props.children}
    </div>
  </div>
);

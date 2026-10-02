import { cn } from 'cn';
import {
  BookmarkIcon,
  CircleAlertIcon,
  CircleCheckIcon,
  ClockIcon,
  InfoIcon,
  MessageSquareIcon,
  NotebookPenIcon,
} from 'lucide-react';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Marksheet alert tones, in place of the Bootstrap colours: a plain note, folder green,
 * the three marks (pass, pencil, red pen for errors only) and two steps of the ink ramp.
 */
export const ALERT_TONES = ['note', 'folder', 'pass', 'pencil', 'pen', 'muted', 'ink'] as const;

export type AlertTone = (typeof ALERT_TONES)[number];

const TONE_CLASS: Record<AlertTone, string> = {
  note: 'border-ink-200 bg-paper-card text-ink-900',
  folder: 'border-folder/30 bg-folder/[0.06] text-folder',
  pass: 'border-pass/30 bg-pass/[0.06] text-pass',
  pencil: 'border-pencil/30 bg-pencil/[0.06] text-pencil',
  pen: 'border-pen/30 bg-pen/[0.06] text-pen',
  muted: 'border-ink-200 bg-ink-100 text-ink-900',
  ink: 'border-ink-900 bg-ink-900 text-paper-card',
};

const LIVE_ROLE = { assertive: 'alert', polite: 'status', off: 'note' } as const;

const TONE_ICON: Record<AlertTone, typeof InfoIcon> = {
  note: MessageSquareIcon,
  folder: BookmarkIcon,
  pass: CircleCheckIcon,
  pencil: ClockIcon,
  pen: CircleAlertIcon,
  muted: InfoIcon,
  ink: NotebookPenIcon,
};

/**
 * An alert in one of the Marksheet tones.
 * @param props Component props.
 * @param props.tone The tone.
 * @param props.title Bold first line.
 * @param props.action A control in the top-right corner (close button).
 * @param props.live How it is announced: `assertive` (the default, an `alert`), `polite` (a
 *   `status`) or `off` (a static `note`).
 * @param props.className Extra classes.
 * @param props.children The message.
 * @returns The alert.
 */
export const ToneAlert = (props: {
  tone: AlertTone;
  title?: React.ReactNode;
  action?: React.ReactNode;
  live?: keyof typeof LIVE_ROLE;
  className?: string;
  children?: React.ReactNode;
}) => {
  const Icon = TONE_ICON[props.tone];

  return (
    <Alert
      role={LIVE_ROLE[props.live ?? 'assertive']}
      className={cn(
        'px-3.5 py-3 [&_a]:font-semibold [&_a]:underline [&_a]:underline-offset-3',
        TONE_CLASS[props.tone],
        props.className,
      )}
    >
      <Icon aria-hidden="true" />
      {props.title && <AlertTitle className="font-semibold">{props.title}</AlertTitle>}
      {props.children && (
        <AlertDescription className="text-current [&_a]:hover:text-current">
          {props.children}
        </AlertDescription>
      )}
      {props.action && <AlertAction className="top-1.5 right-1.5">{props.action}</AlertAction>}
    </Alert>
  );
};

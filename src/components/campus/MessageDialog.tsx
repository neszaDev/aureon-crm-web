'use client';

import type { LucideIcon } from 'lucide-react';
import { MessageSquareWarningIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

/** The message shown by the dialog; `number` and `code` print as `# number-code`. */
export type DialogMessageContent = { title: string; message: string; number: string; code: string };

/** One button of the dialog; clicking it closes the dialog and reports its `code`. */
export type DialogMessageButton = {
  code: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'outline' | 'destructive';
};

/**
 * The error message dialog (Vue `DialogMessage`): a title, the message, a reference code and
 * a configurable row of buttons. A click outside does not close it; a button or Escape does.
 * @param props Component props.
 * @param props.open Whether the dialog is shown.
 * @param props.onOpenChange Called when the dialog asks to open or close.
 * @param props.content The message to show.
 * @param props.buttons The buttons, in order.
 * @param props.onAction Called with the clicked button's code.
 * @returns The dialog.
 */
export const MessageDialog = (props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content: DialogMessageContent;
  buttons: DialogMessageButton[];
  onAction: (code: string) => void;
}) => {
  const t = useTranslations('CampusMessageDialog');

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onInteractOutside={(event) => {
          event.preventDefault();
        }}
        className="gap-0 overflow-hidden rounded-lg p-0 sm:max-w-md"
      >
        <DialogHeader className="flex-row items-center justify-between gap-3 border-b border-pen/20 bg-pen/[0.06] px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base font-bold text-pen">
            <MessageSquareWarningIcon aria-hidden="true" className="size-5" />
            {props.content.title}
          </DialogTitle>
          <small className="text-xs font-semibold text-ink-600 tabular-nums">
            <span className="sr-only">{t('reference')} </span>
            {`# ${props.content.number}-${props.content.code}`}
          </small>
        </DialogHeader>
        <DialogDescription className="px-5 py-5 text-[0.9375rem] text-ink-900">
          {props.content.message}
        </DialogDescription>
        <div className="flex flex-wrap justify-end gap-2 border-t border-ink-200 bg-paper px-5 py-3">
          {props.buttons.map((button) => (
            <Button
              key={button.code}
              size="sm"
              variant={button.variant ?? 'outline'}
              onClick={() => {
                props.onOpenChange(false);
                props.onAction(button.code);
              }}
            >
              {button.icon && <button.icon data-icon="inline-start" />}
              {button.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

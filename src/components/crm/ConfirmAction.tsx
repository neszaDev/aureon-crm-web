'use client';

import { LoaderCircleIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { ActionAlert } from '@/components/crm/ActionAlert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { ActionResult } from '@/libs/api/ApiError';

/**
 * A destructive action behind a confirmation. The dialog stays open until the action succeeds,
 * and shows the backend's message when it refuses (the last owner, a stage in use, ...).
 * Without a trigger, the caller opens it (`open`, `onOpenChange`), e.g. after a select changed.
 * @param props Component props.
 * @param props.trigger The button that opens the dialog.
 * @param props.open Whether it is open, when the caller controls it.
 * @param props.onOpenChange Called when it opens or closes.
 * @param props.returnFocus Takes the focus back on close when there is no trigger.
 * @param props.title The question.
 * @param props.description What happens.
 * @param props.children A note under the description.
 * @param props.confirmLabel The confirming button's label.
 * @param props.cancelLabel The cancelling button's label.
 * @param props.action Runs the action.
 * @returns The trigger and its dialog.
 */
export const ConfirmAction = (props: {
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  returnFocus?: React.RefObject<HTMLElement | null>;
  title: string;
  description: string;
  children?: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  action: () => Promise<ActionResult>;
}) => {
  const [ownOpen, setOwnOpen] = useState(false);
  const [failure, setFailure] = useState<ActionResult>();
  const [isPending, startTransition] = useTransition();
  const open = props.open ?? ownOpen;
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    setFailure(undefined);
    props.onOpenChange?.(next);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      {props.trigger && <AlertDialogTrigger asChild>{props.trigger}</AlertDialogTrigger>}
      <AlertDialogContent
        onCloseAutoFocus={
          props.returnFocus &&
          ((event) => {
            event.preventDefault();
            props.returnFocus?.current?.focus();
          })
        }
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{props.title}</AlertDialogTitle>
          <AlertDialogDescription>{props.description}</AlertDialogDescription>
        </AlertDialogHeader>
        {props.children}
        <ActionAlert result={failure} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{props.cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              // Keep the dialog open until the action is done.
              event.preventDefault();
              setFailure(undefined);
              startTransition(async () => {
                const result = await props.action();
                if (result.ok) {
                  setOpen(false);
                } else {
                  setFailure(result);
                }
              });
            }}
          >
            {isPending && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
            {props.confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

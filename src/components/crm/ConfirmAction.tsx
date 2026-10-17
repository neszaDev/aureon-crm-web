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
 * @param props Component props.
 * @param props.trigger The button that opens the dialog.
 * @param props.title The question.
 * @param props.description What happens.
 * @param props.confirmLabel The confirming button's label.
 * @param props.cancelLabel The cancelling button's label.
 * @param props.action Runs the action.
 * @returns The trigger and its dialog.
 */
export const ConfirmAction = (props: {
  trigger: React.ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  action: () => Promise<ActionResult>;
}) => {
  const [open, setOpen] = useState(false);
  const [failure, setFailure] = useState<ActionResult>();
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setFailure(undefined);
      }}
    >
      <AlertDialogTrigger asChild>{props.trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{props.title}</AlertDialogTitle>
          <AlertDialogDescription>{props.description}</AlertDialogDescription>
        </AlertDialogHeader>
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

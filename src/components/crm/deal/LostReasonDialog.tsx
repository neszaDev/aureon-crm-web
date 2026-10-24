'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { LostReasonValues } from '@/validations/crm/DealValidation';
import { LostReasonValidation, REASON_MAX } from '@/validations/crm/DealValidation';

/** A reason dialog's own words: a bulk action's, for several records. */
type ReasonText = { title: string; description: string; submit: string };

/**
 * The reason field, mounted each time the dialog opens, so it starts empty.
 * @param props The dialog's props.
 * @param props.dealName The deal's name, for the title.
 * @param props.text What it says instead of the deal's own title, description and button.
 * @param props.onConfirm Called with the reason once it is valid.
 * @returns The form.
 */
const LostReasonForm = (props: {
  dealName: string;
  text?: ReasonText;
  onConfirm: (reason: string) => void;
}) => {
  const t = useTranslations('LostReasonDialog');
  const form = useForm<LostReasonValues>({
    resolver: zodResolver(LostReasonValidation),
    defaultValues: { reason: '' },
  });
  const { errors } = form.formState;

  return (
    <form
      method="post"
      onSubmit={form.handleSubmit((values) => {
        props.onConfirm(values.reason);
      })}
      className="flex flex-col gap-4"
      noValidate
    >
      <DialogHeader>
        <DialogTitle>{props.text?.title ?? t('title', { name: props.dealName })}</DialogTitle>
        <DialogDescription>{props.text?.description ?? t('description')}</DialogDescription>
      </DialogHeader>
      <FormField
        htmlFor="lost-reason"
        label={t('reason_label')}
        hint={t('reason_hint')}
        error={errors.reason}
      >
        <Textarea
          id="lost-reason"
          maxLength={REASON_MAX}
          autoFocus
          aria-invalid={errors.reason ? true : undefined}
          aria-describedby={describedBy('lost-reason')}
          {...form.register('reason')}
        />
      </FormField>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {t('cancel')}
          </Button>
        </DialogClose>
        <Button type="submit">{props.text?.submit ?? t('submit')}</Button>
      </DialogFooter>
    </form>
  );
};

/**
 * Asks why a deal was lost when its card is dropped on the Lost column: the reason (at most 500
 * characters) is required, and stays on the deal. Cancelling moves nothing. The board opens it
 * (`open`, `onOpenChange`) and makes the move once the reason is given. A bulk action asks once
 * for all its records in its own words (`text`): deals lost, or leads unqualified.
 * @param props Component props.
 * @param props.open Whether it is open.
 * @param props.onOpenChange Called when it opens or closes.
 * @param props.dealName The deal's name, for the title.
 * @param props.text What it says instead of the deal's own title, description and button.
 * @param props.onConfirm Called with the reason; the dialog closes.
 * @param props.onCancel Called when it is closed without a reason (Cancel, Escape, outside).
 * @param props.returnFocus The element that takes the focus back on close (the card's handle,
 *   which the keyboard drag came from).
 * @returns The dialog.
 */
export const LostReasonDialog = (props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealName: string;
  text?: ReasonText;
  onConfirm: (reason: string) => void;
  onCancel?: () => void;
  returnFocus?: () => HTMLElement | null | undefined;
}) => {
  const t = useTranslations('LostReasonDialog');

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        props.onOpenChange(open);
        // Only a dismissal comes this way: a confirmed reason closes it from the form.
        if (!open) {
          props.onCancel?.();
        }
      }}
    >
      <DialogContent
        closeLabel={t('close')}
        onCloseAutoFocus={(event) => {
          const target = props.returnFocus?.();
          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <LostReasonForm
          dealName={props.dealName}
          text={props.text}
          onConfirm={(reason) => {
            props.onOpenChange(false);
            props.onConfirm(reason);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

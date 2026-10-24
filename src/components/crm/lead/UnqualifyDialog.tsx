'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { changeLeadStatus } from '@/actions/crm/LeadActions';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/libs/api/ApiError';
import { applyFieldErrors } from '@/libs/form/ApplyFieldErrors';
import { useInFlight } from '@/utils/InFlight';
import { useSettle } from '@/utils/SettleAction';
import type { UnqualifyValues } from '@/validations/crm/LeadValidation';
import { UnqualifyValidation } from '@/validations/crm/LeadValidation';

type UnqualifyProps = {
  workspaceId: number;
  leadId: number;
  version: number;
  name: string;
  returnFocus?: () => HTMLElement | null | undefined;
};

/**
 * The reason field, mounted each time the dialog opens, so it starts empty.
 * @param props The dialog's props.
 * @param props.onDone Closes the dialog once saved.
 * @param props.once Runs the save unless one is on its way (the dialog stays open meanwhile).
 * @returns The form.
 */
const UnqualifyForm = (
  props: UnqualifyProps & { onDone: () => void; once: (run: () => Promise<void>) => Promise<void> },
) => {
  const t = useTranslations('UnqualifyDialog');
  const settle = useSettle();
  const [failure, setFailure] = useState<ActionResult>();
  const form = useForm<UnqualifyValues>({
    resolver: zodResolver(UnqualifyValidation),
    defaultValues: { reason: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    const result = await settle(
      changeLeadStatus(props.workspaceId, props.leadId, props.version, {
        status: 'UNQUALIFIED',
        reason: values.reason,
      }),
    );
    if (result.ok) {
      toast.success(t('done'));
      props.onDone();
      return;
    }

    setFailure(applyFieldErrors(form, result, (name) => (name === 'reason' ? name : undefined)));
  });

  return (
    <form
      method="post"
      onSubmit={(event) => {
        // Not a native POST, whether or not a request is already on its way.
        event.preventDefault();
        void props.once(async () => {
          await onSubmit(event);
        });
      }}
      className="flex flex-col gap-4"
      noValidate
    >
      <DialogHeader>
        <DialogTitle>{t('title', { name: props.name })}</DialogTitle>
        <DialogDescription>{t('description')}</DialogDescription>
      </DialogHeader>
      <ActionAlert result={failure} />
      <FormField
        htmlFor="unqualify-reason"
        label={t('reason_label')}
        hint={t('reason_hint')}
        error={errors.reason}
      >
        <Textarea
          id="unqualify-reason"
          aria-invalid={errors.reason ? true : undefined}
          aria-describedby={describedBy('unqualify-reason')}
          {...form.register('reason')}
        />
      </FormField>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {t('submit')}
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * Marks a lead unqualified: the reason (at most 500 characters) is asked for and stays on the
 * lead. A refusal shows in the dialog; once saved it closes with a toast and the page refreshes.
 * The caller opens it (`open`, `onOpenChange`), from the status menu.
 * @param props Component props.
 * @param props.open Whether it is open.
 * @param props.onOpenChange Called when it opens or closes.
 * @param props.onCancel Called when it is closed without saving (Cancel, Escape, outside).
 * @param props.workspaceId The workspace.
 * @param props.leadId The lead.
 * @param props.version The version the page was read at.
 * @param props.name The lead's name, for the title.
 * @param props.returnFocus The element that takes the focus back on close (the menu's button,
 *   as the item that opened the dialog is gone).
 * @returns The dialog.
 */
export const UnqualifyDialog = (
  props: UnqualifyProps & {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCancel?: () => void;
  },
) => {
  const t = useTranslations('UnqualifyDialog');
  const inFlight = useInFlight();

  return (
    <Dialog
      open={props.open}
      onOpenChange={(next) => {
        // Closing would lose the answer: a refusal, or a status that has landed.
        if (next || !inFlight.busy()) {
          props.onOpenChange(next);
          // Only a dismissal comes this way: a save closes it from the form.
          if (!next) {
            props.onCancel?.();
          }
        }
      }}
    >
      <DialogContent
        closeLabel={t('close')}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto"
        onCloseAutoFocus={(event) => {
          const target = props.returnFocus?.();
          if (target) {
            event.preventDefault();
            target.focus();
          }
        }}
      >
        <UnqualifyForm
          {...props}
          once={inFlight.once}
          onDone={() => {
            props.onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

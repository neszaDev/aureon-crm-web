'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { moveDeal } from '@/actions/crm/DealActions';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/libs/api/ApiError';
import type { StageRef } from '@/libs/crm/Stages';
import { applyFieldErrors } from '@/libs/form/ApplyFieldErrors';
import { useInFlight } from '@/utils/InFlight';
import { useSettle } from '@/utils/SettleAction';
import type { MoveFormValues } from '@/validations/crm/DealValidation';
import { MoveFormValidation, REASON_MAX } from '@/validations/crm/DealValidation';

type MoveProps = {
  workspaceId: number;
  deal: { id: number; name: string; version: number; stageId: number };
  stages: StageRef[];
};

const FIELDS: Record<string, keyof MoveFormValues> = {
  stageId: 'stageId',
  lostReason: 'lostReason',
};

/**
 * The move's fields, mounted each time the dialog opens, so it starts from the stage after the
 * deal's own. Won and Lost say that the deal closes; Lost asks for its reason.
 * @param props The dialog's props.
 * @param props.onDone Closes the dialog once the move is saved.
 * @param props.once Runs the save unless one is on its way (the dialog stays open meanwhile).
 * @returns The form.
 */
const MoveForm = (
  props: MoveProps & { onDone: () => void; once: (run: () => Promise<void>) => Promise<void> },
) => {
  const t = useTranslations('MoveDealDialog');
  const settle = useSettle();
  const [failure, setFailure] = useState<ActionResult>();
  const choices = props.stages.filter((stage) => stage.id !== props.deal.stageId);
  // The stage after the deal's own, else the first other one.
  const next =
    props.stages.slice(props.stages.findIndex((stage) => stage.id === props.deal.stageId) + 1)[0] ??
    choices[0];
  const form = useForm<MoveFormValues>({
    resolver: zodResolver(MoveFormValidation),
    defaultValues: { stageId: next?.id, lost: next?.kind === 'LOST', lostReason: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const stageId = useWatch({ control: form.control, name: 'stageId' });
  const chosen = choices.find((stage) => stage.id === stageId);

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    const result = await settle(
      moveDeal(props.workspaceId, props.deal.id, {
        stageId: values.stageId,
        version: props.deal.version,
        lostReason: values.lost ? values.lostReason : undefined,
      }),
    );
    if (result.ok) {
      toast.success(t('done', { name: props.deal.name, stage: chosen?.name ?? '' }));
      props.onDone();
      return;
    }

    setFailure(applyFieldErrors(form, result, (name) => FIELDS[name]));
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
        <DialogTitle>{t('title', { name: props.deal.name })}</DialogTitle>
        <DialogDescription>{t('description')}</DialogDescription>
      </DialogHeader>
      <ActionAlert result={failure} />
      <FormField htmlFor="move-stage" label={t('stage_label')} error={errors.stageId}>
        <NativeSelect
          id="move-stage"
          aria-invalid={errors.stageId ? true : undefined}
          aria-describedby={describedBy('move-stage')}
          {...form.register('stageId', {
            setValueAs: Number,
            // The reason counts for Lost only.
            onChange: (event: React.ChangeEvent<HTMLSelectElement>) => {
              const stage = choices.find((item) => item.id === Number(event.target.value));
              form.setValue('lost', stage?.kind === 'LOST');
            },
          })}
        >
          {choices.map((stage) => (
            <NativeSelectOption key={stage.id} value={stage.id}>
              {stage.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>
      {chosen && chosen.kind !== 'OPEN' && (
        <p className="max-w-[65ch] text-sm text-muted-foreground">
          {chosen.kind === 'WON' ? t('closes_won') : t('closes_lost')}
        </p>
      )}
      {chosen?.kind === 'LOST' && (
        <FormField
          htmlFor="move-reason"
          label={t('reason_label')}
          hint={t('reason_hint')}
          error={errors.lostReason}
        >
          <Textarea
            id="move-reason"
            maxLength={REASON_MAX}
            aria-invalid={errors.lostReason ? true : undefined}
            aria-describedby={describedBy('move-reason')}
            {...form.register('lostReason')}
          />
        </FormField>
      )}
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
 * Moves a deal to another stage, in a dialog: the stage (every other one), and for Lost the
 * reason. Won and Lost say that the deal closes. A refusal shows inside the dialog (the stale
 * version with a reload); once saved it closes with a toast and the page refreshes. Opened by
 * its own `trigger`, or by the caller (`open`, `onOpenChange`, with `returnFocus` for the
 * control that opened it, such as a card's menu button).
 * @param props Component props.
 * @param props.workspaceId The workspace.
 * @param props.deal The deal's id, name, version and stage.
 * @param props.stages The pipeline's stages, in order.
 * @param props.trigger The button that opens the dialog.
 * @param props.open Whether it is open, when the caller controls it.
 * @param props.onOpenChange Called when it opens or closes.
 * @param props.returnFocus Without a trigger: the element that takes the focus back on close.
 * @returns The trigger, if any, and its dialog.
 */
export const MoveDealDialog = (
  props: MoveProps & {
    trigger?: React.ReactElement;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    returnFocus?: () => HTMLElement | null | undefined;
  },
) => {
  const t = useTranslations('MoveDealDialog');
  const [ownOpen, setOwnOpen] = useState(false);
  const inFlight = useInFlight();
  const open = props.open ?? ownOpen;
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    props.onOpenChange?.(next);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Closing would lose the answer: a refusal, or a move that has landed.
        if (next || !inFlight.busy()) {
          setOpen(next);
        }
      }}
    >
      {props.trigger && <DialogTrigger asChild>{props.trigger}</DialogTrigger>}
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
        <MoveForm
          {...props}
          once={inFlight.once}
          onDone={() => {
            setOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

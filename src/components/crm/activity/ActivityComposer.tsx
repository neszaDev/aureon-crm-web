'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon, MailIcon, PhoneIcon, StickyNoteIcon, UsersIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { DateTimeField } from '@/components/crm/fields/DateTimeField';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { ActionResult } from '@/libs/api/ApiError';
import { toLocalInput } from '@/libs/crm/ZonedTime';
import { applyFieldErrors } from '@/libs/form/ApplyFieldErrors';
import { useSettle } from '@/utils/SettleAction';
import type { ActivityFormValues } from '@/validations/crm/ActivityValidation';
import { ACTIVITY_TYPES, ActivityFormValidation } from '@/validations/crm/ActivityValidation';

const isFormField = (field: string): field is keyof ActivityFormValues =>
  field in ActivityFormValidation.shape;

const TYPE_ICONS = { CALL: PhoneIcon, EMAIL: MailIcon, MEETING: UsersIcon, NOTE: StickyNoteIcon };

/**
 * An activity type's icon, decorative: its name is always written beside it.
 * @param props Component props.
 * @param props.type The type.
 * @returns The icon.
 */
export const ActivityTypeIcon = (props: { type: ActivityFormValues['type'] }) => {
  const Icon = TYPE_ICONS[props.type];
  return <Icon aria-hidden="true" />;
};

/**
 * An activity's fields: its type (Call, Email, Meeting, Note), subject, details and when it
 * happened, in the workspace's time zone. Logging a new one clears it for the next, "When" back
 * to now; editing one says so and hands back. A refusal shows at its top.
 * @param props Component props.
 * @param props.defaults The starting values.
 * @param props.timeZone The workspace's time zone.
 * @param props.save Saves the values; `whenChanged` tells whether "When" was changed (unchanged:
 *   now on a new activity, as it was on an edit).
 * @param props.savedMessage The toast once saved.
 * @param props.submitLabel The submit button's label.
 * @param props.onSaved Called once saved; without it the form clears for the next activity.
 * @param props.onCancel Called by "Cancel", when the form has one (editing).
 * @returns The form.
 */
export const ActivityComposer = (props: {
  defaults: ActivityFormValues;
  timeZone: string;
  save: (values: ActivityFormValues, whenChanged: boolean) => Promise<ActionResult>;
  savedMessage: string;
  submitLabel: string;
  onSaved?: () => void;
  onCancel?: () => void;
}) => {
  const t = useTranslations('ActivityComposer');
  const id = useId();
  const settle = useSettle();
  const [failure, setFailure] = useState<ActionResult>();
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(ActivityFormValidation),
    defaultValues: props.defaults,
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    const result = await settle(props.save(values, form.getFieldState('occurredAt').isDirty));
    if (result.ok) {
      toast.success(props.savedMessage);
      if (props.onSaved) {
        props.onSaved();
      } else {
        // Ready for the next one, of the same type, happening now. Field by field: `reset` finds
        // the fields through registrations that the compiled form makes only once, so it clears
        // the inputs the first time and never again.
        form.resetField('subject');
        form.resetField('body');
        form.resetField('occurredAt', {
          defaultValue: toLocalInput(new Date().toISOString(), props.timeZone),
        });
      }
      return;
    }

    // `links` is no field of the form: its error is the alert, not "check the highlighted fields".
    setFailure(applyFieldErrors(form, result, (name) => (isFormField(name) ? name : undefined)));
  });

  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <ActionAlert result={failure} />
      <div className="flex flex-col gap-2">
        <span
          id={`${id}-type`}
          className="text-[0.8125rem] leading-snug font-medium text-muted-foreground"
        >
          {t('type_label')}
        </span>
        <Controller
          control={form.control}
          name="type"
          render={(controller) => (
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={1}
              aria-labelledby={`${id}-type`}
              value={controller.field.value}
              // A type is always chosen: pressing the chosen one again keeps it.
              onValueChange={(value) => {
                const type = ACTIVITY_TYPES.find((item) => item === value);
                if (type) {
                  controller.field.onChange(type);
                }
              }}
              className="flex-wrap"
            >
              {ACTIVITY_TYPES.map((type) => (
                <ToggleGroupItem key={type} value={type} className="h-9 px-3">
                  <ActivityTypeIcon type={type} />
                  {t(`type_${type}`)}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        />
      </div>
      <FormField htmlFor={`${id}-subject`} label={t('subject_label')} error={errors.subject}>
        <Input
          id={`${id}-subject`}
          autoComplete="off"
          aria-invalid={errors.subject ? true : undefined}
          aria-describedby={describedBy(`${id}-subject`)}
          {...form.register('subject')}
        />
      </FormField>
      <FormField htmlFor={`${id}-body`} label={t('body_label')} error={errors.body}>
        <Textarea
          id={`${id}-body`}
          aria-invalid={errors.body ? true : undefined}
          aria-describedby={describedBy(`${id}-body`)}
          {...form.register('body')}
        />
      </FormField>
      <Controller
        control={form.control}
        name="occurredAt"
        render={(controller) => (
          <DateTimeField
            id={`${id}-when`}
            label={t('when_label')}
            value={controller.field.value}
            onChange={(value) => {
              controller.field.onChange(value);
            }}
            timeZone={props.timeZone}
            error={errors.occurredAt}
          />
        )}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {props.submitLabel}
        </Button>
        {props.onCancel && (
          <Button type="button" variant="ghost" onClick={props.onCancel}>
            {t('cancel')}
          </Button>
        )}
      </div>
    </form>
  );
};

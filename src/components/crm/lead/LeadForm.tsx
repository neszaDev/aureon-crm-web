'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { BanknoteIcon, CalendarIcon, FlagIcon, SignpostIcon, UserRoundIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { RegisterOptions } from 'react-hook-form';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { DateTimeField } from '@/components/crm/fields/DateTimeField';
import { OwnerField } from '@/components/crm/fields/OwnerField';
import { SourceField } from '@/components/crm/fields/SourceField';
import {
  CHIP_ROW,
  DateValue,
  FormActions,
  FormDetails,
  PersonValue,
  PropertyChip,
  sourceValue,
  TITLE_INPUT,
  TitleField,
} from '@/components/crm/record/RecordForm';
import { describedBy, FormField } from '@/components/FormField';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import { applyFieldErrors } from '@/libs/form/ApplyFieldErrors';
import { useSettle } from '@/utils/SettleAction';
import type { LeadValues } from '@/validations/crm/LeadValidation';
import { LEAD_PRIORITIES, LeadValidation } from '@/validations/crm/LeadValidation';

type TextField =
  | 'firstName'
  | 'lastName'
  | 'companyName'
  | 'email'
  | 'phone'
  | 'jobTitle'
  | 'estimatedValue'
  | 'notes';

const isFormField = (field: string): field is keyof LeadValues => field in LeadValidation.shape;

/**
 * A lead's fields, to create one or edit it, in the work-OS way: their name large first, their
 * owner, priority, follow-up, estimated value and source as chips under it, then their details.
 * Creating redirects to the new lead (in a record panel, the panel shows it); editing says "Saved"
 * until the next change. A value without a currency takes the workspace's.
 * @param props Component props.
 * @param props.action Saves the values (`createLead`, or `updateLead` with the version).
 * @param props.defaults The starting values: empty with the caller as owner and Medium priority,
 *   or the saved ones.
 * @param props.isEdit Whether a saved lead is edited (an owner may then be taken off).
 * @param props.members The workspace's members, for the owner.
 * @param props.me The caller's user id.
 * @param props.canAssign Whether the caller may change the owner (`RECORDS_ASSIGN`).
 * @param props.sources Every lead source, archived ones included.
 * @param props.defaultCurrency The workspace's currency, which a value without one takes.
 * @param props.currencies The currencies on offer, each with its name in the page's language
 *   (built on the server, so the browser hydrates the same options).
 * @param props.timeZone The workspace's time zone, for the calendar.
 * @param props.cancelHref Where "Cancel" goes.
 * @param props.submitLabel The submit button's label.
 * @returns The form.
 */
export const LeadForm = (props: {
  action: (values: LeadValues) => Promise<ActionResult>;
  defaults: LeadValues;
  isEdit?: boolean;
  members: components['schemas']['MemberRef'][];
  me: number;
  canAssign: boolean;
  sources: components['schemas']['LeadSourceResponse'][];
  defaultCurrency: string;
  currencies: { value: string; label: string }[];
  timeZone: string;
  cancelHref: string;
  submitLabel: string;
}) => {
  const t = useTranslations('LeadForm');
  const settle = useSettle();
  const tStatus = useTranslations('LeadStatus');
  const [failure, setFailure] = useState<ActionResult>();
  const [saved, setSaved] = useState(false);
  const form = useForm<LeadValues>({
    resolver: zodResolver(LeadValidation),
    defaultValues: props.defaults,
  });
  const { errors, isSubmitting } = form.formState;
  const creating = props.isEdit !== true;
  // What the chips show.
  const [priority, estimatedValue, currency] = useWatch({
    control: form.control,
    name: ['priority', 'estimatedValue', 'currency'],
  });
  const field = (
    name: TextField,
    id: string,
    options?: RegisterOptions<LeadValues, TextField>,
  ) => ({
    id,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': describedBy(id),
    ...form.register(name, options),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    setSaved(false);
    const result = await settle(props.action(values));
    if (result.ok) {
      // The fields show what was saved: trimmed, the email in lower case.
      form.reset(values);
      setSaved(true);
      return;
    }

    setFailure(applyFieldErrors(form, result, (name) => (isFormField(name) ? name : undefined)));
  });

  return (
    <form
      method="post"
      onSubmit={onSubmit}
      // "Saved" is about the values sent: an edit takes it away.
      onChange={() => {
        setSaved(false);
      }}
      className="flex flex-col gap-5"
      noValidate
    >
      <ActionAlert result={failure} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-x-6 gap-y-1 *:basis-48">
          <TitleField id="lead-first-name" label={t('first_name_label')} error={errors.firstName}>
            <Input
              autoComplete="given-name"
              // A new lead starts with their name (in a record panel too, `data-autofocus`).
              autoFocus={creating}
              data-autofocus={creating ? '' : undefined}
              placeholder={t('first_name_label')}
              className={TITLE_INPUT}
              {...field('firstName', 'lead-first-name')}
            />
          </TitleField>
          <TitleField id="lead-last-name" label={t('last_name_label')} error={errors.lastName}>
            <Input
              autoComplete="family-name"
              placeholder={t('last_name_label')}
              className={TITLE_INPUT}
              {...field('lastName', 'lead-last-name')}
            />
          </TitleField>
        </div>
        <div className={CHIP_ROW}>
          <Controller
            control={form.control}
            name="ownerId"
            render={(controller) => (
              <PropertyChip
                id="lead-owner-chip"
                label={t('owner_label')}
                icon={UserRoundIcon}
                value={
                  <PersonValue
                    members={props.members}
                    me={props.me}
                    userId={controller.field.value}
                  />
                }
                error={errors.ownerId}
              >
                <OwnerField
                  id="lead-owner"
                  label={t('owner_label')}
                  value={controller.field.value}
                  onChange={(value) => {
                    controller.field.onChange(value);
                    setSaved(false);
                  }}
                  members={props.members}
                  me={props.me}
                  canAssign={props.canAssign}
                  allowUnassigned={!creating}
                  error={errors.ownerId}
                />
              </PropertyChip>
            )}
          />
          <PropertyChip
            id="lead-priority-chip"
            label={t('priority_label')}
            icon={FlagIcon}
            value={<span className="truncate">{tStatus(`priority_${priority}`)}</span>}
            error={errors.priority}
          >
            <FormField htmlFor="lead-priority" label={t('priority_label')} error={errors.priority}>
              <NativeSelect
                id="lead-priority"
                defaultValue={priority}
                aria-invalid={errors.priority ? true : undefined}
                aria-describedby={describedBy('lead-priority')}
                {...form.register('priority')}
              >
                {LEAD_PRIORITIES.map((item) => (
                  <NativeSelectOption key={item} value={item}>
                    {tStatus(`priority_${item}`)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
          </PropertyChip>
          <Controller
            control={form.control}
            name="followUpDate"
            render={(controller) => (
              <PropertyChip
                id="lead-follow-up-chip"
                label={t('follow_up_label')}
                icon={CalendarIcon}
                value={
                  controller.field.value ? <DateValue value={controller.field.value} /> : undefined
                }
                error={errors.followUpDate}
              >
                <DateTimeField
                  id="lead-follow-up"
                  label={t('follow_up_label')}
                  value={controller.field.value}
                  onChange={(value) => {
                    controller.field.onChange(value);
                    setSaved(false);
                  }}
                  timeZone={props.timeZone}
                  clearable
                  dateOnly
                  error={errors.followUpDate}
                />
              </PropertyChip>
            )}
          />
          <PropertyChip
            id="lead-value-chip"
            label={t('value_label')}
            icon={BanknoteIcon}
            value={
              estimatedValue ? (
                <span className="truncate tabular-nums">
                  {estimatedValue} {currency || props.defaultCurrency}
                </span>
              ) : undefined
            }
            error={errors.estimatedValue ?? errors.currency}
          >
            <FormField
              htmlFor="lead-value"
              label={t('value_label')}
              hint={t('value_hint')}
              error={errors.estimatedValue}
            >
              <Input
                inputMode="decimal"
                autoComplete="off"
                {...field('estimatedValue', 'lead-value', {
                  // The API always returns a currency with a value: without the value it means
                  // nothing.
                  onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
                    if (event.target.value.trim() === '') {
                      form.setValue('currency', '');
                    }
                  },
                })}
              />
            </FormField>
            <FormField htmlFor="lead-currency" label={t('currency_label')} error={errors.currency}>
              <NativeSelect
                id="lead-currency"
                defaultValue={currency}
                aria-invalid={errors.currency ? true : undefined}
                aria-describedby={describedBy('lead-currency')}
                {...form.register('currency')}
              >
                <NativeSelectOption value="">
                  {t('currency_default', { code: props.defaultCurrency })}
                </NativeSelectOption>
                {props.currencies.map((option) => (
                  <NativeSelectOption key={option.value} value={option.value}>
                    {option.label}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </FormField>
          </PropertyChip>
          <Controller
            control={form.control}
            name="sourceId"
            render={(controller) => (
              <PropertyChip
                id="lead-source-chip"
                label={t('source_label')}
                icon={SignpostIcon}
                value={sourceValue(props.sources, controller.field.value)}
                error={errors.sourceId}
              >
                <SourceField
                  id="lead-source"
                  label={t('source_label')}
                  value={controller.field.value}
                  onChange={(value) => {
                    controller.field.onChange(value);
                    setSaved(false);
                  }}
                  sources={props.sources}
                  error={errors.sourceId}
                />
              </PropertyChip>
            )}
          />
        </div>
      </div>

      <FormDetails id="lead-details">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField htmlFor="lead-email" label={t('email_label')} error={errors.email}>
            <Input type="email" autoComplete="email" {...field('email', 'lead-email')} />
          </FormField>
          <FormField htmlFor="lead-phone" label={t('phone_label')} error={errors.phone}>
            <Input type="tel" autoComplete="tel" {...field('phone', 'lead-phone')} />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField htmlFor="lead-company" label={t('company_label')} error={errors.companyName}>
            <Input autoComplete="organization" {...field('companyName', 'lead-company')} />
          </FormField>
          <FormField htmlFor="lead-job-title" label={t('job_title_label')} error={errors.jobTitle}>
            <Input autoComplete="organization-title" {...field('jobTitle', 'lead-job-title')} />
          </FormField>
        </div>

        <FormField htmlFor="lead-notes" label={t('notes_label')} error={errors.notes}>
          <Textarea className="min-h-28" {...field('notes', 'lead-notes')} />
        </FormField>
      </FormDetails>

      <FormActions
        submitLabel={props.submitLabel}
        cancelLabel={t('cancel')}
        cancelHref={props.cancelHref}
        submitting={isSubmitting}
        saved={saved ? t('saved') : undefined}
      />
    </form>
  );
};

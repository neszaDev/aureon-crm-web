'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { RegisterOptions } from 'react-hook-form';
import { Controller, useForm } from 'react-hook-form';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { DateTimeField } from '@/components/crm/fields/DateTimeField';
import { OwnerField } from '@/components/crm/fields/OwnerField';
import { SourceField } from '@/components/crm/fields/SourceField';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import { applyFieldErrors } from '@/libs/form/ApplyFieldErrors';
import { Link } from '@/libs/I18nNavigation';
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
 * A lead's fields, to create one or edit it. Creating redirects to the new lead; editing says
 * "Saved" until the next change. A value without a currency takes the workspace's.
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
  const tStatus = useTranslations('LeadStatus');
  const [failure, setFailure] = useState<ActionResult>();
  const [saved, setSaved] = useState(false);
  const form = useForm<LeadValues>({
    resolver: zodResolver(LeadValidation),
    defaultValues: props.defaults,
  });
  const { errors, isSubmitting } = form.formState;
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
    const result = await props.action(values);
    if (result.ok) {
      // The fields show what was saved: trimmed, the email in lower case.
      form.reset(values);
      setSaved(true);
      return;
    }

    applyFieldErrors(form, result.fieldErrors, (name) => (isFormField(name) ? name : undefined));
    setFailure(result);
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

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField htmlFor="lead-first-name" label={t('first_name_label')} error={errors.firstName}>
          <Input autoComplete="given-name" {...field('firstName', 'lead-first-name')} />
        </FormField>
        <FormField htmlFor="lead-last-name" label={t('last_name_label')} error={errors.lastName}>
          <Input autoComplete="family-name" {...field('lastName', 'lead-last-name')} />
        </FormField>
      </div>

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

      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="ownerId"
          render={(controller) => (
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
              allowUnassigned={props.isEdit ?? false}
              error={errors.ownerId}
            />
          )}
        />
        <Controller
          control={form.control}
          name="sourceId"
          render={(controller) => (
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
          )}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField htmlFor="lead-priority" label={t('priority_label')} error={errors.priority}>
          <NativeSelect
            id="lead-priority"
            // Also the server-rendered choice: the form sets the value once it is hydrated.
            defaultValue={props.defaults.priority}
            aria-invalid={errors.priority ? true : undefined}
            aria-describedby={describedBy('lead-priority')}
            {...form.register('priority')}
          >
            {LEAD_PRIORITIES.map((priority) => (
              <NativeSelectOption key={priority} value={priority}>
                {tStatus(`priority_${priority}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
        <Controller
          control={form.control}
          name="followUpDate"
          render={(controller) => (
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
          )}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
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
              // The API always returns a currency with a value: without the value it means nothing.
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
            defaultValue={props.defaults.currency}
            aria-invalid={errors.currency ? true : undefined}
            aria-describedby={describedBy('lead-currency')}
            {...form.register('currency')}
          >
            <NativeSelectOption value="">
              {t('currency_default', { code: props.defaultCurrency })}
            </NativeSelectOption>
            {props.currencies.map((currency) => (
              <NativeSelectOption key={currency.value} value={currency.value}>
                {currency.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <FormField htmlFor="lead-notes" label={t('notes_label')} error={errors.notes}>
        <Textarea className="min-h-28" {...field('notes', 'lead-notes')} />
      </FormField>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {props.submitLabel}
        </Button>
        <Button asChild variant="ghost">
          <Link href={props.cancelHref}>{t('cancel')}</Link>
        </Button>
        <output className="text-sm font-medium text-success">{saved && t('saved')}</output>
      </div>
    </form>
  );
};

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
import type { PickedRecord } from '@/components/crm/fields/RecordPicker';
import { RecordPicker } from '@/components/crm/fields/RecordPicker';
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
import type { DealValues } from '@/validations/crm/DealValidation';
import { DealValidation } from '@/validations/crm/DealValidation';

type TextField = 'name' | 'amount' | 'probability' | 'notes';

const isFormField = (field: string): field is keyof DealValues => field in DealValidation.shape;

/**
 * A deal's fields, to create one or edit it. Creating picks the stage (an open one) and
 * redirects to the new deal; editing has no stage (only a move changes it) and says "Saved"
 * until the next change. A deal without a currency takes the workspace's, one without a
 * probability its stage's. The amount is checked as digits with up to 2 decimals, and sent as
 * the text typed.
 * @param props Component props.
 * @param props.action Saves the values (`createDeal`, or `updateDeal` with the version).
 * @param props.defaults The starting values: empty with the caller as owner and the first open
 *   stage, or the saved ones.
 * @param props.isEdit Whether a saved deal is edited (an owner may then be taken off, and there
 *   is no stage).
 * @param props.workspaceId The workspace, whose companies and contacts the pickers search.
 * @param props.company The company `defaults.companyId` names, with its name, or null.
 * @param props.contact The contact `defaults.contactId` names, with its name, or null.
 * @param props.members The workspace's members, for the owner.
 * @param props.me The caller's user id.
 * @param props.canAssign Whether the caller may change the owner (`RECORDS_ASSIGN`).
 * @param props.sources Every lead source, archived ones included.
 * @param props.stages The open stages a new deal may start in, by position.
 * @param props.stageName The saved deal's stage, shown read-only (an edit has no stage field).
 * @param props.defaultCurrency The workspace's currency, which a deal without one takes.
 * @param props.currencies The currencies on offer, each with its name in the page's language
 *   (built on the server, so the browser hydrates the same options).
 * @param props.timeZone The workspace's time zone, for the calendar.
 * @param props.cancelHref Where "Cancel" goes.
 * @param props.submitLabel The submit button's label.
 * @returns The form.
 */
export const DealForm = (props: {
  action: (values: DealValues) => Promise<ActionResult>;
  defaults: DealValues;
  isEdit?: boolean;
  workspaceId: number;
  company: PickedRecord | null;
  contact: PickedRecord | null;
  members: components['schemas']['MemberRef'][];
  me: number;
  canAssign: boolean;
  sources: components['schemas']['LeadSourceResponse'][];
  stages: components['schemas']['StageResponse'][];
  stageName?: string;
  defaultCurrency: string;
  currencies: { value: string; label: string }[];
  timeZone: string;
  cancelHref: string;
  submitLabel: string;
}) => {
  const t = useTranslations('DealForm');
  const [failure, setFailure] = useState<ActionResult>();
  const [saved, setSaved] = useState(false);
  const [company, setCompany] = useState(props.company);
  const [contact, setContact] = useState(props.contact);
  const form = useForm<DealValues>({
    resolver: zodResolver(DealValidation),
    defaultValues: props.defaults,
  });
  const { errors, isSubmitting } = form.formState;
  const field = (
    name: TextField,
    id: string,
    options?: RegisterOptions<DealValues, TextField>,
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
      // The fields show what was saved: trimmed.
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

      <FormField htmlFor="deal-name" label={t('name_label')} error={errors.name}>
        <Input autoComplete="off" {...field('name', 'deal-name')} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          htmlFor="deal-amount"
          label={t('amount_label')}
          hint={t('amount_hint')}
          error={errors.amount}
        >
          <Input inputMode="decimal" autoComplete="off" {...field('amount', 'deal-amount')} />
        </FormField>
        <FormField htmlFor="deal-currency" label={t('currency_label')} error={errors.currency}>
          <NativeSelect
            id="deal-currency"
            // Also the server-rendered choice: the form sets the value once it is hydrated.
            defaultValue={props.defaults.currency}
            aria-invalid={errors.currency ? true : undefined}
            aria-describedby={describedBy('deal-currency')}
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

      <div className="grid gap-5 sm:grid-cols-2">
        {props.isEdit ? (
          // Only a move changes the stage (the backend takes none on an update).
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-[0.8125rem] leading-snug font-medium text-muted-foreground">
              {t('stage_label')}
            </span>
            <p className="flex min-h-10 items-center font-medium break-words">{props.stageName}</p>
            <p className="text-[0.8125rem] text-muted-foreground">{t('stage_read_only')}</p>
          </div>
        ) : (
          <FormField htmlFor="deal-stage" label={t('stage_label')} error={errors.stageId}>
            <NativeSelect
              id="deal-stage"
              defaultValue={props.defaults.stageId ?? undefined}
              aria-invalid={errors.stageId ? true : undefined}
              aria-describedby={describedBy('deal-stage')}
              {...form.register('stageId', {
                setValueAs: (value) => (value ? Number(value) : null),
              })}
            >
              {props.stages.map((stage) => (
                <NativeSelectOption key={stage.id} value={stage.id}>
                  {stage.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </FormField>
        )}
        <FormField
          htmlFor="deal-probability"
          label={t('probability_label')}
          hint={t('probability_hint')}
          error={errors.probability}
        >
          <Input
            inputMode="numeric"
            autoComplete="off"
            {...field('probability', 'deal-probability')}
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="expectedCloseDate"
          render={(controller) => (
            <DateTimeField
              id="deal-close"
              label={t('close_label')}
              value={controller.field.value}
              onChange={(value) => {
                controller.field.onChange(value);
                setSaved(false);
              }}
              timeZone={props.timeZone}
              clearable
              dateOnly
              error={errors.expectedCloseDate}
            />
          )}
        />
        <Controller
          control={form.control}
          name="sourceId"
          render={(controller) => (
            <SourceField
              id="deal-source"
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
        <FormField htmlFor="deal-company" label={t('company_label')} error={errors.companyId}>
          <Controller
            control={form.control}
            name="companyId"
            render={(controller) => (
              <RecordPicker
                id="deal-company"
                workspaceId={props.workspaceId}
                kind="company"
                value={company}
                invalid={Boolean(errors.companyId)}
                describedBy={errors.companyId ? describedBy('deal-company') : undefined}
                onChange={(next) => {
                  setCompany(next);
                  controller.field.onChange(next?.id ?? null);
                  setSaved(false);
                }}
              />
            )}
          />
        </FormField>
        <FormField htmlFor="deal-contact" label={t('contact_label')} error={errors.contactId}>
          <Controller
            control={form.control}
            name="contactId"
            render={(controller) => (
              <RecordPicker
                id="deal-contact"
                workspaceId={props.workspaceId}
                kind="contact"
                value={contact}
                invalid={Boolean(errors.contactId)}
                describedBy={errors.contactId ? describedBy('deal-contact') : undefined}
                onChange={(next) => {
                  setContact(next);
                  controller.field.onChange(next?.id ?? null);
                  setSaved(false);
                }}
              />
            )}
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="ownerId"
          render={(controller) => (
            <OwnerField
              id="deal-owner"
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
      </div>

      <FormField htmlFor="deal-notes" label={t('notes_label')} error={errors.notes}>
        <Textarea className="min-h-28" {...field('notes', 'deal-notes')} />
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

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2Icon, SignpostIcon, UserRoundIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { TagInput } from '@/components/crm/contact/TagInput';
import { OwnerField } from '@/components/crm/fields/OwnerField';
import type { PickedRecord } from '@/components/crm/fields/RecordPicker';
import { RecordPicker } from '@/components/crm/fields/RecordPicker';
import { SourceField } from '@/components/crm/fields/SourceField';
import { DuplicateWarning } from '@/components/crm/record/DuplicateWarning';
import {
  CHIP_ROW,
  FormActions,
  FormDetails,
  PersonValue,
  PropertyChip,
  sourceValue,
  TITLE_INPUT,
  TitleField,
} from '@/components/crm/record/RecordForm';
import { usePanelIds } from '@/components/crm/record/RecordPanel';
import { describedBy, FormField } from '@/components/FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import { applyFieldErrors } from '@/libs/form/ApplyFieldErrors';
import { useSettle } from '@/utils/SettleAction';
import type { ContactDuplicateValues, ContactValues } from '@/validations/crm/ContactValidation';
import { ContactValidation } from '@/validations/crm/ContactValidation';

type TextField = 'firstName' | 'lastName' | 'email' | 'phone' | 'jobTitle' | 'notes';

const isFormField = (field: string): field is keyof ContactValues =>
  field in ContactValidation.shape;

/**
 * A contact's fields, to create one or edit it, in the work-OS way: their name large first, their
 * owner, company and source as chips under it, then their details. After the email or phone
 * loses focus, contacts that look the same are listed (a hint: saving stays possible). Creating
 * redirects to the new contact (in a record panel, the panel shows it); editing says "Saved"
 * until the next change.
 * @param props Component props.
 * @param props.action Saves the values (`createContact`, or `updateContact` with the version).
 * @param props.findDuplicates Finds look-alikes (`findContactDuplicates` bound to the workspace).
 * @param props.defaults The starting values: empty with the caller as owner, or the saved ones.
 * @param props.company The company `defaults.companyId` names, with its name, or null.
 * @param props.recordId The contact being edited; without it the form creates one.
 * @param props.workspaceId The workspace, whose companies the company field searches.
 * @param props.members The workspace's members, for the owner.
 * @param props.me The caller's user id.
 * @param props.canAssign Whether the caller may change the owner (`RECORDS_ASSIGN`).
 * @param props.sources Every lead source, archived ones included.
 * @param props.tags The workspace's tags, suggested while typing one.
 * @param props.listPath The contacts list, which a contact's page is under.
 * @param props.cancelHref Where "Cancel" goes.
 * @param props.submitLabel The submit button's label.
 * @returns The form.
 */
export const ContactForm = (props: {
  action: (values: ContactValues) => Promise<ActionResult>;
  findDuplicates: (
    values: ContactDuplicateValues,
    excludeId?: number,
  ) => Promise<components['schemas']['ContactRef'][]>;
  defaults: ContactValues;
  company: PickedRecord | null;
  recordId?: number;
  workspaceId: number;
  members: components['schemas']['MemberRef'][];
  me: number;
  canAssign: boolean;
  sources: components['schemas']['LeadSourceResponse'][];
  tags: string[];
  listPath: string;
  cancelHref: string;
  submitLabel: string;
}) => {
  const t = useTranslations('ContactForm');
  const fieldId = usePanelIds();
  const settle = useSettle();
  const [failure, setFailure] = useState<ActionResult>();
  const [saved, setSaved] = useState(false);
  const [duplicates, setDuplicates] = useState<components['schemas']['ContactRef'][]>([]);
  const [company, setCompany] = useState(props.company);
  const form = useForm<ContactValues>({
    resolver: zodResolver(ContactValidation),
    defaultValues: props.defaults,
  });
  const { errors, isSubmitting, isDirty } = form.formState;
  const creating = props.recordId === undefined;
  // The tags' own error (the 20-tag cap, a tag's length), typed as an array's by react-hook-form.
  const tagsError =
    errors.tags?.message === undefined
      ? undefined
      : { type: 'validate', message: errors.tags.message };
  const checkDuplicates = async () => {
    const values = form.getValues();
    let found: components['schemas']['ContactRef'][];
    try {
      found = await props.findDuplicates(
        { email: values.email, phone: values.phone },
        props.recordId,
      );
    } catch {
      // Only a hint: without an answer there is none.
      found = [];
    }
    // Only an answer to what is typed now counts: an older one that comes last would show the
    // wrong list.
    const now = form.getValues();
    if (now.email === values.email && now.phone === values.phone) {
      setDuplicates(found);
    }
  };
  const field = (name: TextField, id: string) => ({
    id,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': describedBy(id),
    // The email and phone are what look-alikes are found by.
    ...form.register(
      name,
      name === 'email' || name === 'phone' ? { onBlur: checkDuplicates } : undefined,
    ),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    setSaved(false);
    const result = await settle(props.action(values));
    if (result.ok) {
      // The fields show what was saved: trimmed, the email in lower case, the tags sorted.
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
      // Typed into: a record panel around it doesn't close on Escape or a click outside.
      data-dirty={isDirty ? '' : undefined}
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
          <TitleField
            id={fieldId('contact-first-name')}
            label={t('first_name_label')}
            error={errors.firstName}
          >
            <Input
              autoComplete="given-name"
              // A new contact starts with their name (in a record panel too, `data-autofocus`).
              autoFocus={creating}
              data-autofocus={creating ? '' : undefined}
              placeholder={t('first_name_label')}
              className={TITLE_INPUT}
              {...field('firstName', fieldId('contact-first-name'))}
            />
          </TitleField>
          <TitleField
            id={fieldId('contact-last-name')}
            label={t('last_name_label')}
            error={errors.lastName}
          >
            <Input
              autoComplete="family-name"
              placeholder={t('last_name_label')}
              className={TITLE_INPUT}
              {...field('lastName', fieldId('contact-last-name'))}
            />
          </TitleField>
        </div>
        <div className={CHIP_ROW}>
          <Controller
            control={form.control}
            name="ownerId"
            render={(controller) => (
              <PropertyChip
                id={fieldId('contact-owner-chip')}
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
                  id={fieldId('contact-owner')}
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
          <Controller
            control={form.control}
            name="companyId"
            render={(controller) => (
              <PropertyChip
                id={fieldId('contact-company-chip')}
                label={t('company_label')}
                icon={Building2Icon}
                value={company ? <span className="truncate">{company.label}</span> : undefined}
                error={errors.companyId}
              >
                <FormField
                  htmlFor={fieldId('contact-company')}
                  label={t('company_label')}
                  error={errors.companyId}
                >
                  <RecordPicker
                    id={fieldId('contact-company')}
                    workspaceId={props.workspaceId}
                    kind="company"
                    value={company}
                    invalid={Boolean(errors.companyId)}
                    describedBy={
                      errors.companyId ? describedBy(fieldId('contact-company')) : undefined
                    }
                    onChange={(next) => {
                      setCompany(next);
                      controller.field.onChange(next?.id ?? null);
                      setSaved(false);
                    }}
                  />
                </FormField>
              </PropertyChip>
            )}
          />
          <Controller
            control={form.control}
            name="sourceId"
            render={(controller) => (
              <PropertyChip
                id={fieldId('contact-source-chip')}
                label={t('source_label')}
                icon={SignpostIcon}
                value={sourceValue(props.sources, controller.field.value)}
                error={errors.sourceId}
              >
                <SourceField
                  id={fieldId('contact-source')}
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

      <FormDetails id="contact-details">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            htmlFor={fieldId('contact-email')}
            label={t('email_label')}
            error={errors.email}
          >
            <Input
              type="email"
              autoComplete="email"
              {...field('email', fieldId('contact-email'))}
            />
          </FormField>
          <FormField
            htmlFor={fieldId('contact-phone')}
            label={t('phone_label')}
            error={errors.phone}
          >
            <Input type="tel" autoComplete="tel" {...field('phone', fieldId('contact-phone'))} />
          </FormField>
        </div>

        <DuplicateWarning
          items={duplicates.map((contact) => ({
            id: contact.id,
            label: contact.fullName,
            detail: contact.email ?? contact.phone,
            href: `${props.listPath}/${contact.id}`,
          }))}
        />

        <FormField
          htmlFor={fieldId('contact-job-title')}
          label={t('job_title_label')}
          error={errors.jobTitle}
        >
          <Input
            autoComplete="organization-title"
            {...field('jobTitle', fieldId('contact-job-title'))}
          />
        </FormField>

        <FormField htmlFor={fieldId('contact-tags')} label={t('tags_label')} error={tagsError}>
          <Controller
            control={form.control}
            name="tags"
            render={(controller) => (
              <TagInput
                id={fieldId('contact-tags')}
                value={controller.field.value}
                onChange={(tags) => {
                  controller.field.onChange(tags);
                  setSaved(false);
                  // A tag that is too long says so as it goes in, not at submit.
                  void form.trigger('tags');
                }}
                suggestions={props.tags}
                invalid={Boolean(tagsError)}
                errorId={tagsError ? describedBy(fieldId('contact-tags')) : undefined}
              />
            )}
          />
        </FormField>

        <FormField htmlFor={fieldId('contact-notes')} label={t('notes_label')} error={errors.notes}>
          <Textarea className="min-h-28" {...field('notes', fieldId('contact-notes'))} />
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

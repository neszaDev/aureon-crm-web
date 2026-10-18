'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
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
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import { Link } from '@/libs/I18nNavigation';
import type { ContactDuplicateValues, ContactValues } from '@/validations/crm/ContactValidation';
import { ContactValidation } from '@/validations/crm/ContactValidation';

type TextField = 'firstName' | 'lastName' | 'email' | 'phone' | 'jobTitle' | 'notes';

const isFormField = (field: string): field is keyof ContactValues =>
  field in ContactValidation.shape;

/**
 * A contact's fields, to create one or edit it. After the email or phone loses focus, contacts
 * that look the same are listed (a hint: saving stays possible). Creating redirects to the new
 * contact; editing says "Saved" until the next change.
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
  const [failure, setFailure] = useState<ActionResult>();
  const [saved, setSaved] = useState(false);
  const [duplicates, setDuplicates] = useState<components['schemas']['ContactRef'][]>([]);
  const [company, setCompany] = useState(props.company);
  const form = useForm<ContactValues>({
    resolver: zodResolver(ContactValidation),
    defaultValues: props.defaults,
  });
  const { errors, isSubmitting } = form.formState;
  // The tags' own error (the 20-tag cap, a tag's length), typed as an array's by react-hook-form.
  const tagsError =
    errors.tags?.message === undefined
      ? undefined
      : { type: 'validate', message: errors.tags.message };
  const checkDuplicates = async () => {
    const values = form.getValues();
    setDuplicates(
      await props.findDuplicates({ email: values.email, phone: values.phone }, props.recordId),
    );
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
    const result = await props.action(values);
    if (result.ok) {
      // The fields show what was saved: trimmed, the email in lower case, the tags sorted.
      form.reset(values);
      setSaved(true);
      return;
    }

    for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
      if (isFormField(name)) {
        form.setError(name, { type: 'server', message });
      }
    }
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
        <FormField
          htmlFor="contact-first-name"
          label={t('first_name_label')}
          error={errors.firstName}
        >
          <Input autoComplete="given-name" {...field('firstName', 'contact-first-name')} />
        </FormField>
        <FormField htmlFor="contact-last-name" label={t('last_name_label')} error={errors.lastName}>
          <Input autoComplete="family-name" {...field('lastName', 'contact-last-name')} />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField htmlFor="contact-email" label={t('email_label')} error={errors.email}>
          <Input type="email" autoComplete="email" {...field('email', 'contact-email')} />
        </FormField>
        <FormField htmlFor="contact-phone" label={t('phone_label')} error={errors.phone}>
          <Input type="tel" autoComplete="tel" {...field('phone', 'contact-phone')} />
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

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField htmlFor="contact-job-title" label={t('job_title_label')} error={errors.jobTitle}>
          <Input autoComplete="organization-title" {...field('jobTitle', 'contact-job-title')} />
        </FormField>
        <FormField htmlFor="contact-company" label={t('company_label')} error={errors.companyId}>
          <Controller
            control={form.control}
            name="companyId"
            render={(controller) => (
              <RecordPicker
                id="contact-company"
                workspaceId={props.workspaceId}
                kind="company"
                value={company}
                invalid={Boolean(errors.companyId)}
                describedBy={errors.companyId ? describedBy('contact-company') : undefined}
                onChange={(next) => {
                  setCompany(next);
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
              id="contact-owner"
              label={t('owner_label')}
              value={controller.field.value}
              onChange={(value) => {
                controller.field.onChange(value);
                setSaved(false);
              }}
              members={props.members}
              me={props.me}
              canAssign={props.canAssign}
              allowUnassigned={props.recordId !== undefined}
              error={errors.ownerId}
            />
          )}
        />
        <Controller
          control={form.control}
          name="sourceId"
          render={(controller) => (
            <SourceField
              id="contact-source"
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

      <FormField htmlFor="contact-tags" label={t('tags_label')} error={tagsError}>
        <Controller
          control={form.control}
          name="tags"
          render={(controller) => (
            <TagInput
              id="contact-tags"
              value={controller.field.value}
              onChange={(tags) => {
                controller.field.onChange(tags);
                setSaved(false);
                // A tag that is too long says so as it goes in, not at submit.
                void form.trigger('tags');
              }}
              suggestions={props.tags}
              invalid={Boolean(tagsError)}
              errorId={tagsError ? describedBy('contact-tags') : undefined}
            />
          )}
        />
      </FormField>

      <FormField htmlFor="contact-notes" label={t('notes_label')} error={errors.notes}>
        <Textarea className="min-h-28" {...field('notes', 'contact-notes')} />
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

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { OwnerField } from '@/components/crm/fields/OwnerField';
import { DuplicateWarning } from '@/components/crm/record/DuplicateWarning';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import { applyFieldErrors } from '@/libs/form/ApplyFieldErrors';
import { Link } from '@/libs/I18nNavigation';
import type { CompanyDuplicateValues, CompanyValues } from '@/validations/crm/CompanyValidation';
import { CompanyValidation } from '@/validations/crm/CompanyValidation';

type TextField = Exclude<keyof CompanyValues, 'ownerId'>;

const isFormField = (field: string): field is keyof CompanyValues =>
  field in CompanyValidation.shape;

/**
 * A company's fields, to create one or edit it. After the name or website loses focus, companies
 * that look the same are listed (a hint: saving stays possible). Creating redirects to the new
 * company; editing says "Saved" until the next change.
 * @param props Component props.
 * @param props.action Saves the values (`createCompany`, or `updateCompany` with the version).
 * @param props.findDuplicates Finds look-alikes (`findCompanyDuplicates` bound to the workspace).
 * @param props.defaults The starting values: empty with the caller as owner, or the saved ones.
 * @param props.recordId The company being edited; without it the form creates one.
 * @param props.members The workspace's members, for the owner.
 * @param props.me The caller's user id.
 * @param props.canAssign Whether the caller may change the owner (`RECORDS_ASSIGN`).
 * @param props.listPath The companies list, which a company's page is under.
 * @param props.cancelHref Where "Cancel" goes.
 * @param props.submitLabel The submit button's label.
 * @returns The form.
 */
export const CompanyForm = (props: {
  action: (values: CompanyValues) => Promise<ActionResult>;
  findDuplicates: (
    values: CompanyDuplicateValues,
    excludeId?: number,
  ) => Promise<components['schemas']['CompanyRef'][]>;
  defaults: CompanyValues;
  recordId?: number;
  members: components['schemas']['MemberRef'][];
  me: number;
  canAssign: boolean;
  listPath: string;
  cancelHref: string;
  submitLabel: string;
}) => {
  const t = useTranslations('CompanyForm');
  const [failure, setFailure] = useState<ActionResult>();
  const [saved, setSaved] = useState(false);
  const [duplicates, setDuplicates] = useState<components['schemas']['CompanyRef'][]>([]);
  const form = useForm<CompanyValues>({
    resolver: zodResolver(CompanyValidation),
    defaultValues: props.defaults,
  });
  const { errors, isSubmitting } = form.formState;
  const checkDuplicates = async () => {
    const values = form.getValues();
    setDuplicates(
      await props.findDuplicates({ name: values.name, website: values.website }, props.recordId),
    );
  };
  const field = (name: TextField, id: string) => ({
    id,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': describedBy(id),
    // The name and website are what look-alikes are found by.
    ...form.register(
      name,
      name === 'name' || name === 'website' ? { onBlur: checkDuplicates } : undefined,
    ),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    setSaved(false);
    const result = await props.action(values);
    if (result.ok) {
      // The fields show what was saved: trimmed, the website with its scheme.
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

      <FormField htmlFor="company-name" label={t('name_label')} error={errors.name}>
        <Input autoComplete="organization" {...field('name', 'company-name')} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          htmlFor="company-industry"
          label={t('industry_label')}
          hint={t('industry_hint')}
          error={errors.industry}
        >
          <Input autoComplete="off" {...field('industry', 'company-industry')} />
        </FormField>
        <FormField
          htmlFor="company-website"
          label={t('website_label')}
          hint={t('website_hint')}
          error={errors.website}
        >
          <Input type="url" autoComplete="url" {...field('website', 'company-website')} />
        </FormField>
      </div>

      <DuplicateWarning
        items={duplicates.map((company) => ({
          id: company.id,
          label: company.name,
          detail: company.website,
          href: `${props.listPath}/${company.id}`,
        }))}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField htmlFor="company-phone" label={t('phone_label')} error={errors.phone}>
          <Input type="tel" autoComplete="tel" {...field('phone', 'company-phone')} />
        </FormField>
        <FormField
          htmlFor="company-employees"
          label={t('employees_label')}
          error={errors.employeeCount}
        >
          <Input
            inputMode="numeric"
            autoComplete="off"
            {...field('employeeCount', 'company-employees')}
          />
        </FormField>
      </div>

      <Controller
        control={form.control}
        name="ownerId"
        render={(controller) => (
          <OwnerField
            id="company-owner"
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

      <FormField htmlFor="company-address" label={t('address_label')} error={errors.address}>
        <Textarea autoComplete="street-address" {...field('address', 'company-address')} />
      </FormField>

      <FormField htmlFor="company-notes" label={t('notes_label')} error={errors.notes}>
        <Textarea className="min-h-28" {...field('notes', 'company-notes')} />
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

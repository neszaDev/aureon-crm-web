'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { UserRoundIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { OwnerField } from '@/components/crm/fields/OwnerField';
import { DuplicateWarning } from '@/components/crm/record/DuplicateWarning';
import {
  CHIP_ROW,
  FormActions,
  FormDetails,
  PersonValue,
  PropertyChip,
  TITLE_INPUT,
  TitleField,
} from '@/components/crm/record/RecordForm';
import { describedBy, FormField } from '@/components/FormField';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { ActionResult } from '@/libs/api/ApiError';
import type { components } from '@/libs/api/schema';
import { applyFieldErrors } from '@/libs/form/ApplyFieldErrors';
import { useSettle } from '@/utils/SettleAction';
import type { CompanyDuplicateValues, CompanyValues } from '@/validations/crm/CompanyValidation';
import { CompanyValidation } from '@/validations/crm/CompanyValidation';

type TextField = Exclude<keyof CompanyValues, 'ownerId'>;

const isFormField = (field: string): field is keyof CompanyValues =>
  field in CompanyValidation.shape;

/**
 * A company's fields, to create one or edit it, in the work-OS way: its name large first, its
 * owner as a chip under it, then its details. After the name or website loses focus, companies
 * that look the same are listed (a hint: saving stays possible). Creating redirects to the new
 * company (in a record panel, the panel shows it); editing says "Saved" until the next change.
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
  const settle = useSettle();
  const [failure, setFailure] = useState<ActionResult>();
  const [saved, setSaved] = useState(false);
  const [duplicates, setDuplicates] = useState<components['schemas']['CompanyRef'][]>([]);
  const form = useForm<CompanyValues>({
    resolver: zodResolver(CompanyValidation),
    defaultValues: props.defaults,
  });
  const { errors, isSubmitting } = form.formState;
  const creating = props.recordId === undefined;
  const checkDuplicates = async () => {
    const values = form.getValues();
    let found: components['schemas']['CompanyRef'][];
    try {
      found = await props.findDuplicates(
        { name: values.name, website: values.website },
        props.recordId,
      );
    } catch {
      // Only a hint: without an answer there is none.
      found = [];
    }
    // Only an answer to what is typed now counts: an older one that comes last would show the
    // wrong list.
    const now = form.getValues();
    if (now.name === values.name && now.website === values.website) {
      setDuplicates(found);
    }
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
    const result = await settle(props.action(values));
    if (result.ok) {
      // The fields show what was saved: trimmed, the website with its scheme.
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
        <TitleField id="company-name" label={t('name_label')} error={errors.name}>
          <Input
            autoComplete="organization"
            // A new company starts with its name (in a record panel too, `data-autofocus`).
            autoFocus={creating}
            data-autofocus={creating ? '' : undefined}
            placeholder={t('name_label')}
            className={TITLE_INPUT}
            {...field('name', 'company-name')}
          />
        </TitleField>
        <div className={CHIP_ROW}>
          <Controller
            control={form.control}
            name="ownerId"
            render={(controller) => (
              <PropertyChip
                id="company-owner-chip"
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
                  allowUnassigned={!creating}
                  error={errors.ownerId}
                />
              </PropertyChip>
            )}
          />
        </div>
      </div>

      <FormDetails id="company-details">
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            htmlFor="company-website"
            label={t('website_label')}
            hint={t('website_hint')}
            error={errors.website}
          >
            <Input type="url" autoComplete="url" {...field('website', 'company-website')} />
          </FormField>
          <FormField
            htmlFor="company-industry"
            label={t('industry_label')}
            hint={t('industry_hint')}
            error={errors.industry}
          >
            <Input autoComplete="off" {...field('industry', 'company-industry')} />
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

        <FormField htmlFor="company-address" label={t('address_label')} error={errors.address}>
          <Textarea autoComplete="street-address" {...field('address', 'company-address')} />
        </FormField>

        <FormField htmlFor="company-notes" label={t('notes_label')} error={errors.notes}>
          <Textarea className="min-h-28" {...field('notes', 'company-notes')} />
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

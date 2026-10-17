'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormAlert } from '@/components/FormAlert';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { ActionResult } from '@/libs/api/ApiError';
import type { WorkspaceValues } from '@/validations/crm/WorkspaceValidation';
import { WorkspaceValidation } from '@/validations/crm/WorkspaceValidation';

const isFormField = (field: string): field is keyof WorkspaceValues =>
  field in WorkspaceValidation.shape;

/**
 * Name, default currency and time zone of a new workspace. The time zone starts as the
 * browser's and the currency as USD.
 * @param props Component props.
 * @param props.action Saves the values; it redirects on success, so a result is a failure.
 * @param props.currencies Currency options (ISO code and a label), from the server so the
 *   server and browser render the same list.
 * @param props.timeZones IANA time zones, from the server for the same reason.
 * @returns The form.
 */
export const WorkspaceForm = (props: {
  action: (values: WorkspaceValues) => Promise<ActionResult>;
  currencies: { value: string; label: string }[];
  timeZones: string[];
}) => {
  const t = useTranslations('WorkspaceForm');
  const [formError, setFormError] = useState<string>();
  // Only applied in the browser (react-hook-form fills fields on mount), so it is the user's zone.
  const zone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  const form = useForm<WorkspaceValues>({
    resolver: zodResolver(WorkspaceValidation),
    defaultValues: {
      name: '',
      defaultCurrency: 'USD',
      timezone: props.timeZones.includes(zone) ? zone : 'UTC',
    },
  });
  const { errors, isSubmitting } = form.formState;
  const field = (name: keyof WorkspaceValues, id: string) => ({
    id,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': describedBy(id),
    ...form.register(name),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    const result = await props.action(values);

    for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
      if (isFormField(name)) {
        form.setError(name, { type: 'server', message });
      }
    }
    setFormError(result.message);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {formError && <FormAlert>{formError}</FormAlert>}

      <FormField
        htmlFor="workspace-name"
        label={t('name_label')}
        hint={t('name_hint')}
        error={errors.name}
      >
        <Input autoComplete="organization" {...field('name', 'workspace-name')} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          htmlFor="workspace-currency"
          label={t('currency_label')}
          hint={t('currency_hint')}
          error={errors.defaultCurrency}
        >
          <NativeSelect {...field('defaultCurrency', 'workspace-currency')}>
            {props.currencies.map((currency) => (
              <NativeSelectOption key={currency.value} value={currency.value}>
                {currency.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>

        <FormField
          htmlFor="workspace-timezone"
          label={t('timezone_label')}
          hint={t('timezone_hint')}
          error={errors.timezone}
        >
          <NativeSelect {...field('timezone', 'workspace-timezone')}>
            {props.timeZones.map((timeZone) => (
              <NativeSelectOption key={timeZone} value={timeZone}>
                {timeZone.replaceAll('_', ' ')}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting} className="self-start">
        {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
        {t('submit')}
      </Button>
    </form>
  );
};

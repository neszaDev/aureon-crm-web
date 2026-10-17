'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useSyncExternalStore } from 'react';
import { useForm } from 'react-hook-form';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { ActionResult } from '@/libs/api/ApiError';
import type { WorkspaceValues } from '@/validations/crm/WorkspaceValidation';
import { WorkspaceValidation } from '@/validations/crm/WorkspaceValidation';

const isFormField = (field: string): field is keyof WorkspaceValues =>
  field in WorkspaceValidation.shape;

const subscribeNever = () => () => {
  // Nothing to unsubscribe: the zone doesn't change while the page is open.
};
const browserTimeZone = () => new Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Name, default currency and time zone of a workspace. A new one starts with the browser's time
 * zone (added to the options if the list lacks it) and USD; an existing one with its values.
 * @param props Component props.
 * @param props.action Saves the values. Creating redirects on success; editing returns `ok`.
 * @param props.currencies Currency options (ISO code and a label), from the server so the
 *   server and browser render the same list.
 * @param props.timeZones IANA time zones, from the server for the same reason.
 * @param props.defaults The saved values, when editing.
 * @param props.submitLabel The button's label; "Create workspace" by default.
 * @returns The form.
 */
export const WorkspaceForm = (props: {
  action: (values: WorkspaceValues) => Promise<ActionResult>;
  currencies: { value: string; label: string }[];
  timeZones: string[];
  defaults?: WorkspaceValues;
  submitLabel?: string;
}) => {
  const t = useTranslations('WorkspaceForm');
  const [failure, setFailure] = useState<ActionResult>();
  const [saved, setSaved] = useState(false);
  // The browser's zone, known once hydrated (the server can't know it). It is the default, and an
  // option of its own when the server lists it under another spelling (Asia/Kolkata, Calcutta).
  const zone = useSyncExternalStore(subscribeNever, browserTimeZone, () => null);
  const preferredZone = props.defaults?.timezone ?? zone;
  const timeZones =
    preferredZone === null || props.timeZones.includes(preferredZone)
      ? props.timeZones
      : [...props.timeZones, preferredZone].toSorted();
  const form = useForm<WorkspaceValues>({
    resolver: zodResolver(WorkspaceValidation),
    // `values` rather than defaults: they follow the zone once known (or the saved values once
    // refreshed), keeping what the user changed.
    values: props.defaults ?? { name: '', defaultCurrency: 'USD', timezone: zone ?? 'UTC' },
    resetOptions: { keepDirtyValues: true },
  });
  const { errors, isSubmitting } = form.formState;
  const field = (name: keyof WorkspaceValues, id: string) => ({
    id,
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': describedBy(id),
    ...form.register(name),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    setSaved(false);
    const result = await props.action(values);
    if (result.ok) {
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
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <ActionAlert result={failure} />

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
            {timeZones.map((timeZone) => (
              <NativeSelectOption key={timeZone} value={timeZone}>
                {timeZone.replaceAll('_', ' ')}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {props.submitLabel ?? t('submit')}
        </Button>
        <output className="text-sm font-medium text-success">{saved && t('saved')}</output>
      </div>
    </form>
  );
};

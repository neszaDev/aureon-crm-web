'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/libs/api/ApiError';
import type { PasswordChangeValues } from '@/validations/ProfileValidation';
import { PasswordChangeValidation } from '@/validations/ProfileValidation';

const FIELDS = [
  { name: 'currentPassword', id: 'current-password', autoComplete: 'current-password' },
  { name: 'newPassword', id: 'new-password', autoComplete: 'new-password' },
  { name: 'confirmPassword', id: 'confirm-password', autoComplete: 'new-password' },
] as const;

const isFormField = (field: string): field is keyof PasswordChangeValues =>
  FIELDS.some((item) => item.name === field);

/**
 * Changes your password. This browser stays signed in; every other session ends.
 * @param props Component props.
 * @param props.action Changes the password (`changePassword`).
 * @returns The form.
 */
export const PasswordForm = (props: {
  action: (values: PasswordChangeValues) => Promise<ActionResult>;
}) => {
  const t = useTranslations('PasswordForm');
  const [failure, setFailure] = useState<ActionResult>();
  const [changed, setChanged] = useState(false);
  const form = useForm<PasswordChangeValues>({
    resolver: zodResolver(PasswordChangeValidation),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    setChanged(false);
    const result = await props.action(values);
    if (result.ok) {
      form.reset();
      setChanged(true);
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
      {FIELDS.map((field) => (
        <FormField
          key={field.name}
          htmlFor={field.id}
          label={t(`${field.name}_label`)}
          hint={field.name === 'newPassword' ? t('newPassword_hint') : undefined}
          error={errors[field.name]}
        >
          <Input
            id={field.id}
            type="password"
            autoComplete={field.autoComplete}
            aria-invalid={errors[field.name] ? true : undefined}
            aria-describedby={describedBy(field.id)}
            {...form.register(field.name)}
          />
        </FormField>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {t('submit')}
        </Button>
        <output className="text-sm font-medium text-success">{changed && t('changed')}</output>
      </div>
    </form>
  );
};

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { updateUser } from '@/actions/UserActions';
import { FormAlert } from '@/components/FormAlert';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { UpdateUserValues } from '@/validations/UserValidation';
import { UpdateUserValidation, USER_ROLES } from '@/validations/UserValidation';

const isFormField = (field: string): field is keyof UpdateUserValues =>
  field in UpdateUserValidation.shape;

/**
 * Changes a user's email and role. Saving signs that user out everywhere (the backend revokes
 * their sessions), which the hint says up front.
 * @param props Component props.
 * @param props.id User id.
 * @param props.defaults Current email and role.
 * @returns The form.
 */
export const EditUserForm = (props: { id: number; defaults: UpdateUserValues }) => {
  const t = useTranslations('UserForm');
  const tRole = useTranslations('AccountPage');
  const [formError, setFormError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const form = useForm<UpdateUserValues>({
    resolver: zodResolver(UpdateUserValidation),
    defaultValues: props.defaults,
  });
  const { errors, isSubmitting, isDirty } = form.formState;
  const invalid = (field: keyof UpdateUserValues) => ({
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? describedBy(field) : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    setSaved(false);
    const result = await updateUser(props.id, values);

    if (result.ok) {
      form.reset(values);
      setSaved(true);
      return;
    }
    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      if (isFormField(field)) {
        form.setError(field, { type: 'server', message });
      }
    }
    setFormError(result.message);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {formError && <FormAlert>{formError}</FormAlert>}

      <FormField htmlFor="email" label={t('email_label')} error={errors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="off"
          {...invalid('email')}
          {...form.register('email')}
        />
      </FormField>

      <FormField htmlFor="role" label={t('role_label')} error={errors.role}>
        <NativeSelect id="role" {...invalid('role')} {...form.register('role')}>
          {USER_ROLES.map((role) => (
            <NativeSelectOption key={role} value={role}>
              {tRole(`role_${role}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>

      <p className="text-sm text-ink-600">{t('sign_out_hint')}</p>

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {t('save_button')}
        </Button>
        <output className="text-sm font-medium text-pass">{saved && t('saved')}</output>
      </div>
    </form>
  );
};

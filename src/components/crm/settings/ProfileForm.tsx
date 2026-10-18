'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { ActionAlert } from '@/components/crm/ActionAlert';
import { Seal } from '@/components/crm/Seal';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ActionResult } from '@/libs/api/ApiError';
import type { ProfileValues } from '@/validations/ProfileValidation';
import { ProfileValidation } from '@/validations/ProfileValidation';

/**
 * Your display name, with your seal as it will look. The email is shown, not edited here.
 * @param props Component props.
 * @param props.email The signed-in user's email.
 * @param props.displayName Their display name, if set.
 * @param props.action Saves the name (`updateProfile`).
 * @returns The form.
 */
export const ProfileForm = (props: {
  email: string;
  displayName?: string;
  action: (values: ProfileValues) => Promise<ActionResult>;
}) => {
  const t = useTranslations('ProfileForm');
  const [failure, setFailure] = useState<ActionResult>();
  const [saved, setSaved] = useState(false);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(ProfileValidation),
    defaultValues: { displayName: props.displayName ?? '' },
  });
  const name = useWatch({ control: form.control, name: 'displayName' });
  const { errors, isSubmitting } = form.formState;

  const onSubmit = form.handleSubmit(async (values) => {
    setFailure(undefined);
    setSaved(false);
    const result = await props.action(values);
    if (result.ok) {
      form.reset(values);
      setSaved(true);
      return;
    }

    if (result.fieldErrors?.displayName) {
      form.setError('displayName', { type: 'server', message: result.fieldErrors.displayName });
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
      <div className="flex items-center gap-3.5">
        <Seal name={name.trim() || undefined} email={props.email} size="lg" />
        <div className="flex min-w-0 flex-col">
          <span className="text-[0.8125rem] text-muted-foreground">{t('email_label')}</span>
          <span className="font-medium break-all">{props.email}</span>
        </div>
      </div>
      <FormField
        htmlFor="display-name"
        label={t('name_label')}
        aside={t('optional')}
        hint={t('name_hint')}
        error={errors.displayName}
      >
        <Input
          id="display-name"
          autoComplete="name"
          aria-invalid={errors.displayName ? true : undefined}
          aria-describedby={describedBy('display-name')}
          // In the server's HTML too, so the field isn't empty until the form hydrates.
          defaultValue={props.displayName ?? ''}
          {...form.register('displayName')}
        />
      </FormField>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {t('save')}
        </Button>
        <output className="text-sm font-medium text-success">{saved && t('saved')}</output>
      </div>
    </form>
  );
};

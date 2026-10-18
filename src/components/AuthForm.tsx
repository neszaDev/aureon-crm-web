'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signIn, signUp } from '@/actions/AuthActions';
import { FormAlert } from '@/components/FormAlert';
import { describedBy, FormField } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { applyFieldErrors } from '@/libs/form/ApplyFieldErrors';
import type { AuthValues } from '@/validations/AuthValidation';
import { SignInValidation, SignUpValidation } from '@/validations/AuthValidation';

export const AuthForm = (props: { mode: 'sign-in' | 'sign-up' }) => {
  const t = useTranslations('AuthForm');
  const [formError, setFormError] = useState<string>();
  const form = useForm<AuthValues>({
    resolver: zodResolver(props.mode === 'sign-in' ? SignInValidation : SignUpValidation),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const isSignUp = props.mode === 'sign-up';

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    // Read at submit so the auth pages stay static; the action checks it with safeNextPath.
    const next = new URLSearchParams(window.location.search).get('next');
    // On success the action redirects, so a result means something went wrong.
    const result = await (isSignUp ? signUp(values, next) : signIn(values, next));

    applyFieldErrors(form, result.fieldErrors, (name) =>
      name === 'email' || name === 'password' ? name : undefined,
    );
    setFormError(result.message);
  });

  return (
    <form method="post" onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      {formError && <FormAlert>{formError}</FormAlert>}

      <FormField htmlFor="email" label={t('email_label')} error={errors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? describedBy('email') : undefined}
          {...form.register('email')}
        />
      </FormField>

      <FormField
        htmlFor="password"
        label={t('password_label')}
        hint={isSignUp ? t('password_hint') : undefined}
        error={errors.password}
      >
        <Input
          id="password"
          type="password"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password || isSignUp ? describedBy('password') : undefined}
          {...form.register('password')}
        />
      </FormField>

      <Button type="submit" className="mt-1 w-full" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
        {isSignUp ? t('sign_up_button') : t('sign_in_button')}
      </Button>
    </form>
  );
};

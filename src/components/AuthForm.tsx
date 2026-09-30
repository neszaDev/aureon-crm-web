'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signIn, signUp } from '@/actions/AuthActions';
import { FieldError } from '@/components/FieldError';
import type { AuthValues } from '@/validations/AuthValidation';
import { SignInValidation, SignUpValidation } from '@/validations/AuthValidation';

export const AuthForm = (props: { mode: 'sign-in' | 'sign-up' }) => {
  const t = useTranslations('AuthForm');
  const [formError, setFormError] = useState<string>();
  const form = useForm<AuthValues>({
    resolver: zodResolver(props.mode === 'sign-in' ? SignInValidation : SignUpValidation),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    // On success the action redirects, so a result means something went wrong.
    const result = await (props.mode === 'sign-in' ? signIn(values) : signUp(values));

    for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
      if (field === 'email' || field === 'password') {
        form.setError(field, { type: 'server', message });
      }
    }
    setFormError(result.message);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      <div>
        <label className="text-sm font-bold text-gray-700" htmlFor="email">
          {t('email_label')}
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-sm border px-2 py-1 text-gray-700 focus:ring-3 focus:ring-blue-300/50 focus:outline-hidden"
          {...form.register('email')}
        />
        <FieldError error={form.formState.errors.email} />
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700" htmlFor="password">
          {t('password_label')}
        </label>
        <input
          id="password"
          type="password"
          autoComplete={props.mode === 'sign-in' ? 'current-password' : 'new-password'}
          className="w-full rounded-sm border px-2 py-1 text-gray-700 focus:ring-3 focus:ring-blue-300/50 focus:outline-hidden"
          {...form.register('password')}
        />
        <FieldError error={form.formState.errors.password} />
      </div>

      {formError && (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      )}

      <button
        className="rounded-sm bg-blue-500 px-5 py-1 font-bold text-white hover:bg-blue-600 focus:ring-3 focus:ring-blue-300/50 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        type="submit"
        disabled={form.formState.isSubmitting}
      >
        {props.mode === 'sign-in' ? t('sign_in_button') : t('sign_up_button')}
      </button>
    </form>
  );
};

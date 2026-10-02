'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { FieldError } from '@/components/FieldError';
import { describedBy, FormField } from '@/components/FormField';
import { Mark } from '@/components/report/Mark';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { ShowcaseSignUpValues } from '@/validations/ShowcaseFormValidation';
import { ShowcaseSignUpValidation } from '@/validations/ShowcaseFormValidation';

type Field = keyof ShowcaseSignUpValues;

const EMPTY_FORM: ShowcaseSignUpValues = {
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
  password: '',
  confirmPassword: '',
  accept: false,
};

const TEXT_FIELDS = [
  { name: 'firstName', label: 'first_name_label', type: 'text', autoComplete: 'given-name' },
  { name: 'lastName', label: 'last_name_label', type: 'text', autoComplete: 'family-name' },
  { name: 'userName', label: 'user_name_label', type: 'text', autoComplete: 'username' },
  { name: 'email', label: 'email_label', type: 'email', autoComplete: 'email' },
] as const;

const PASSWORD_FIELDS = [
  { name: 'password', label: 'password_label' },
  { name: 'confirmPassword', label: 'confirm_password_label' },
] as const;

/**
 * A sign-up form validated with react-hook-form and zod, as the Vue page did with vuelidate:
 * each field shows its state once you edit it, "Validate" checks them all, "Submit" is enabled
 * only when the whole form is valid, and "Reset" empties it. The live values are printed beside
 * the form, on a card that turns to the pass colour once submitted.
 * @returns The form and its values.
 */
export const SignUpValidationForm = () => {
  const t = useTranslations('ValidationFormsPage');
  const [edited, setEdited] = useState<ReadonlySet<Field>>(new Set());
  const [validated, setValidated] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ShowcaseSignUpValues>({
    resolver: zodResolver(ShowcaseSignUpValidation),
    mode: 'onChange',
    defaultValues: EMPTY_FORM,
  });
  const values = useWatch({ control: form.control });
  const { errors, isValid } = form.formState;

  const markEdited = (field: Field) => {
    setEdited((current) => (current.has(field) ? current : new Set([...current, field])));
  };
  // Like vuelidate's `$dirty`: a field shows valid or invalid only once it was edited or checked.
  const shown = (field: Field) => validated || edited.has(field);
  const stateOf = (field: Field) => {
    if (!shown(field)) {
      return {};
    }
    return errors[field]
      ? { 'aria-invalid': true, 'aria-describedby': describedBy(field) }
      : { className: 'border-pass hover:border-pass' };
  };
  const errorOf = (field: Field) => (shown(field) ? errors[field] : undefined);

  const onSubmit = form.handleSubmit(() => {
    setSubmitted(true);
  });

  return (
    <div className="grid items-start gap-8 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        {TEXT_FIELDS.map((field) => (
          <FormField
            key={field.name}
            htmlFor={field.name}
            label={t(field.label)}
            error={errorOf(field.name)}
          >
            <Input
              id={field.name}
              type={field.type}
              autoComplete={field.autoComplete}
              placeholder={t(field.label)}
              {...stateOf(field.name)}
              {...form.register(field.name, {
                onChange: () => {
                  markEdited(field.name);
                },
              })}
            />
          </FormField>
        ))}

        <div className="grid gap-5 md:grid-cols-2">
          {PASSWORD_FIELDS.map(({ name, label }) => (
            <FormField key={name} htmlFor={name} label={t(label)} error={errorOf(name)}>
              <Input
                id={name}
                type="password"
                autoComplete="new-password"
                placeholder={t('password_placeholder')}
                {...stateOf(name)}
                {...form.register(name, {
                  onChange: () => {
                    markEdited(name);
                  },
                  deps: name === 'password' ? ['confirmPassword'] : undefined,
                })}
              />
            </FormField>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5">
            <Controller
              control={form.control}
              name="accept"
              render={({ field }) => (
                <Checkbox
                  id="accept"
                  name={field.name}
                  checked={field.value}
                  onBlur={() => {
                    field.onBlur();
                  }}
                  ref={field.ref}
                  aria-invalid={shown('accept') && errors.accept ? true : undefined}
                  aria-describedby={
                    shown('accept') && errors.accept ? describedBy('accept') : undefined
                  }
                  onCheckedChange={(checked) => {
                    field.onChange(checked === true);
                    markEdited('accept');
                  }}
                />
              )}
            />
            <label htmlFor="accept" className="text-[0.9375rem] text-ink-900">
              {t('accept_label')}
            </label>
          </div>
          <FieldError error={errorOf('accept')} id={describedBy('accept')} />
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button type="submit" disabled={!isValid || submitted}>
            {t('submit')}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isValid}
            onClick={async () => {
              setValidated(true);
              await form.trigger();
            }}
          >
            {t('validate')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={edited.size === 0 && !validated}
            onClick={() => {
              form.reset(EMPTY_FORM);
              setEdited(new Set());
              setValidated(false);
              setSubmitted(false);
            }}
          >
            {t('reset')}
          </Button>
        </div>
      </form>

      <section
        aria-labelledby="form-values-heading"
        className={cn(
          'flex flex-col gap-3 rounded-sm border p-4 transition-colors',
          submitted ? 'border-pass/40 bg-pass/[0.06]' : 'border-ink-200 bg-ink-100',
        )}
      >
        <h3
          id="form-values-heading"
          className="flex items-center gap-2 text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-700 uppercase"
        >
          {submitted && <Mark status="PASSED" animate className="size-4" />}
          {submitted ? t('values_submitted') : t('values_title')}
        </h3>
        <pre className="overflow-x-auto font-mono text-[0.8125rem] leading-relaxed text-ink-900">
          {JSON.stringify(values, null, 4)}
        </pre>
      </section>
    </div>
  );
};

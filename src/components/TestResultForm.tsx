'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createTestResult } from '@/actions/TestResultActions';
import { FormAlert } from '@/components/FormAlert';
import { describedBy, FormField } from '@/components/FormField';
import { Mark } from '@/components/report/Mark';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import type { TestResultFormValues } from '@/validations/TestResultValidation';
import { TEST_STATUSES, TestResultFormValidation } from '@/validations/TestResultValidation';

const isFormField = (field: string): field is keyof TestResultFormValues =>
  field in TestResultFormValidation.shape;

export const TestResultForm = () => {
  const t = useTranslations('TestResultForm');
  const [formError, setFormError] = useState<string>();
  const [created, setCreated] = useState(false);
  const form = useForm<TestResultFormValues>({
    resolver: zodResolver(TestResultFormValidation),
    defaultValues: { testName: '', status: 'PENDING', notes: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const invalid = (field: keyof TestResultFormValues) => ({
    'aria-invalid': errors[field] ? true : undefined,
    'aria-describedby': errors[field] ? describedBy(field) : undefined,
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    setCreated(false);
    const result = await createTestResult({
      ...values,
      // datetime-local has no offset; send an ISO instant like the backend expects.
      testedAt: new Date(values.testedAt).toISOString(),
      notes: values.notes === '' ? undefined : values.notes,
    });

    if (result.ok) {
      form.reset();
      setCreated(true);
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
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-x-4 gap-y-5" noValidate>
      {formError && (
        <div className="col-span-2">
          <FormAlert>{formError}</FormAlert>
        </div>
      )}

      <FormField
        htmlFor="testName"
        label={t('test_name_label')}
        error={errors.testName}
        className="col-span-2"
      >
        <Input
          id="testName"
          autoComplete="off"
          {...invalid('testName')}
          {...form.register('testName')}
        />
      </FormField>

      <FormField htmlFor="status" label={t('status_label')} error={errors.status}>
        <NativeSelect id="status" {...invalid('status')} {...form.register('status')}>
          {TEST_STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {t(`status_${status}`)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </FormField>

      <FormField
        htmlFor="score"
        label={t('score_label')}
        aside={t('score_hint')}
        error={errors.score}
      >
        <Input
          id="score"
          type="number"
          step="0.01"
          min={0}
          max={100}
          inputMode="decimal"
          className="tabular-nums"
          {...invalid('score')}
          {...form.register('score', { valueAsNumber: true })}
        />
      </FormField>

      <FormField
        htmlFor="testedAt"
        label={t('tested_at_label')}
        error={errors.testedAt}
        className="col-span-2"
      >
        <Input
          id="testedAt"
          type="datetime-local"
          className="tabular-nums"
          {...invalid('testedAt')}
          {...form.register('testedAt')}
        />
      </FormField>

      <FormField
        htmlFor="notes"
        label={t('notes_label')}
        aside={t('notes_hint')}
        error={errors.notes}
        className="col-span-2"
      >
        <Textarea
          id="notes"
          rows={2}
          className="font-hand text-base leading-snug"
          {...invalid('notes')}
          {...form.register('notes')}
        />
      </FormField>

      <div className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Button type="submit" disabled={isSubmitting} className="min-w-28">
          {isSubmitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
          {t('create_button')}
        </Button>
        <output className="flex items-center gap-1.5 text-sm font-medium text-pass">
          {created && (
            <>
              <Mark status="PASSED" animate className="size-4" />
              {t('created')}
            </>
          )}
        </output>
      </div>
    </form>
  );
};

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { createTestResult } from '@/actions/TestResultActions';
import { FieldError } from '@/components/FieldError';
import type { TestResultFormValues } from '@/validations/TestResultValidation';
import { TEST_STATUSES, TestResultFormValidation } from '@/validations/TestResultValidation';

const isFormField = (field: string): field is keyof TestResultFormValues =>
  field in TestResultFormValidation.shape;

const inputClass =
  'w-full rounded-sm border px-2 py-1 text-gray-700 focus:ring-3 focus:ring-blue-300/50 focus:outline-hidden';

export const TestResultForm = () => {
  const t = useTranslations('TestResultForm');
  const [formError, setFormError] = useState<string>();
  const form = useForm<TestResultFormValues>({
    resolver: zodResolver(TestResultFormValidation),
    defaultValues: { testName: '', status: 'PENDING', notes: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(undefined);
    const result = await createTestResult({
      ...values,
      // datetime-local has no offset; send an ISO instant like the backend expects.
      testedAt: new Date(values.testedAt).toISOString(),
      notes: values.notes === '' ? undefined : values.notes,
    });

    if (result.ok) {
      form.reset();
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
    <form onSubmit={onSubmit} className="grid gap-3 sm:grid-cols-2" noValidate>
      <div>
        <label className="text-sm font-bold text-gray-700" htmlFor="testName">
          {t('test_name_label')}
        </label>
        <input id="testName" className={inputClass} {...form.register('testName')} />
        <FieldError error={form.formState.errors.testName} />
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700" htmlFor="status">
          {t('status_label')}
        </label>
        <select id="status" className={inputClass} {...form.register('status')}>
          {TEST_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`status_${status}`)}
            </option>
          ))}
        </select>
        <FieldError error={form.formState.errors.status} />
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700" htmlFor="score">
          {t('score_label')}
        </label>
        <input
          id="score"
          type="number"
          step="0.01"
          className={inputClass}
          {...form.register('score', { valueAsNumber: true })}
        />
        <FieldError error={form.formState.errors.score} />
      </div>

      <div>
        <label className="text-sm font-bold text-gray-700" htmlFor="testedAt">
          {t('tested_at_label')}
        </label>
        <input
          id="testedAt"
          type="datetime-local"
          className={inputClass}
          {...form.register('testedAt')}
        />
        <FieldError error={form.formState.errors.testedAt} />
      </div>

      <div className="sm:col-span-2">
        <label className="text-sm font-bold text-gray-700" htmlFor="notes">
          {t('notes_label')}
        </label>
        <textarea id="notes" rows={2} className={inputClass} {...form.register('notes')} />
        <FieldError error={form.formState.errors.notes} />
      </div>

      {formError && (
        <p className="text-sm text-red-600 sm:col-span-2" role="alert">
          {formError}
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          className="rounded-sm bg-blue-500 px-5 py-1 font-bold text-white hover:bg-blue-600 focus:ring-3 focus:ring-blue-300/50 focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
          type="submit"
          disabled={form.formState.isSubmitting}
        >
          {t('create_button')}
        </button>
      </div>
    </form>
  );
};

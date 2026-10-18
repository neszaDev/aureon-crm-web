import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';

/**
 * Shows the backend's field errors on a form: each under its field, and nothing left of an
 * earlier submit.
 * @param form The react-hook-form instance.
 * @param fieldErrors The backend's refusals by field name (`ActionResult.fieldErrors`).
 * @param toField Gives the form field a name belongs to, or nothing when the form has none.
 */
export const applyFieldErrors = <Values extends FieldValues>(
  form: Pick<UseFormReturn<Values>, 'clearErrors' | 'setError'>,
  fieldErrors: Record<string, string> | undefined,
  toField: (name: string) => Path<Values> | undefined,
) => {
  // `setError` edits `errors` in place, so the React Compiler's cache (production builds only)
  // would keep the old JSX: `clearErrors()` first gives it a new object.
  form.clearErrors();
  for (const [name, message] of Object.entries(fieldErrors ?? {})) {
    const field = toField(name);
    if (field) {
      form.setError(field, { type: 'server', message });
    }
  }
};

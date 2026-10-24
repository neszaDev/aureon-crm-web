import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import type { ActionResult } from '@/libs/api/ApiError';

/**
 * Shows the backend's field errors on a form: each under its field, and nothing left of an
 * earlier submit.
 * @param form The react-hook-form instance.
 * @param result The action's refusal; its `fieldErrors` are by the backend's field names.
 * @param toField Gives the form field a name belongs to, or nothing when the form has none.
 * @returns The result for the form's alert: as it came, unless some error belongs to no field
 *   of the form. "Check the highlighted fields" would point at nothing, so the alert says
 *   what the backend said about them instead.
 */
export const applyFieldErrors = <Values extends FieldValues>(
  form: Pick<UseFormReturn<Values>, 'clearErrors' | 'setError'>,
  result: ActionResult,
  toField: (name: string) => Path<Values> | undefined,
): ActionResult => {
  // `setError` edits `errors` in place, so the React Compiler's cache (production builds only)
  // would keep the old JSX: `clearErrors()` first gives it a new object.
  form.clearErrors();
  const unplaced: string[] = [];
  for (const [name, message] of Object.entries(result.fieldErrors ?? {})) {
    const field = toField(name);
    if (field) {
      form.setError(field, { type: 'server', message });
    } else {
      unplaced.push(message);
    }
  }

  return unplaced.length > 0 ? { ...result, message: unplaced.join(' ') } : result;
};

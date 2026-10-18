import { CircleAlertIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { FieldError as HookFormFieldError } from 'react-hook-form';
import messages from '@/locales/en.json';

type ValidationKey = keyof typeof messages.Validation;

const isValidationKey = (value: string): value is ValidationKey => value in messages.Validation;

/**
 * Shows a form field error, written in crimson with an icon at the field. Client-side messages are
 * `Validation` keys; server messages (`type: 'server'`) are already human-readable and shown as-is.
 * @param props Component props.
 * @param props.error The react-hook-form error for the field, if any.
 * @param props.id Id for `aria-describedby` on the field.
 * @returns The error message, or nothing when the field is valid.
 */
export const FieldError = (props: { error?: HookFormFieldError; id?: string }) => {
  const t = useTranslations('Validation');
  const message = props.error?.message;

  if (!message) {
    return null;
  }

  return (
    <p
      id={props.id}
      className="flex items-start gap-1.5 text-[0.8125rem] font-medium text-danger"
      role="alert"
    >
      <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      {isValidationKey(message) ? t(message) : message}
    </p>
  );
};

import { useTranslations } from 'next-intl';
import type { FieldError as HookFormFieldError } from 'react-hook-form';
import messages from '@/locales/en.json';

type ValidationKey = keyof typeof messages.Validation;

const isValidationKey = (value: string): value is ValidationKey => value in messages.Validation;

/**
 * Shows a form field error. Client-side messages are `Validation` keys; server messages
 * (`type: 'server'`) are already human-readable and shown as-is.
 * @param props Component props.
 * @param props.error The react-hook-form error for the field, if any.
 * @returns The error message, or nothing when the field is valid.
 */
export const FieldError = (props: { error?: HookFormFieldError }) => {
  const t = useTranslations('Validation');
  const message = props.error?.message;

  if (!message) {
    return null;
  }

  return (
    <p className="mt-1 text-sm text-red-600" role="alert">
      {isValidationKey(message) ? t(message) : message}
    </p>
  );
};

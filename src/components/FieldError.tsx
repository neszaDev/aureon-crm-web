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
 * @param props.label The field's name, written first: for an error shown away from its field (a
 *   record form's property chip).
 * @returns The error message, or nothing when the field is valid.
 */
export const FieldError = (props: { error?: HookFormFieldError; id?: string; label?: string }) => {
  const t = useTranslations('Validation');
  const tChip = useTranslations('ListToolbar');
  const message = props.error?.message;

  if (!message) {
    return null;
  }
  const text = isValidationKey(message) ? t(message) : message;

  return (
    <p
      id={props.id}
      className="flex items-start gap-1.5 text-[0.8125rem] font-medium text-danger"
      role="alert"
    >
      <CircleAlertIcon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      {props.label ? (
        <span>
          <span className="font-semibold">{tChip('chip_on', { label: props.label })}</span> {text}
        </span>
      ) : (
        text
      )}
    </p>
  );
};

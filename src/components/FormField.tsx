import { cn } from 'cn';
import type { FieldError as HookFormFieldError } from 'react-hook-form';
import { FieldError } from '@/components/FieldError';
import { Label } from '@/components/ui/label';

/**
 * Id of a field's hint or error, for the control's `aria-describedby`.
 * @param id Id of the control.
 * @returns The description id.
 */
export const describedBy = (id: string) => `${id}-description`;

/**
 * A form row: printed label, the control on its own ply, then a hint or the error.
 * The control must use `id={props.htmlFor}`; pass `aria-describedby={describedBy(id)}` to it.
 * @param props Component props.
 * @param props.htmlFor Id of the control.
 * @param props.label Visible label.
 * @param props.hint Help text shown under the control until there is an error.
 * @param props.aside Short text on the label's line, such as "Optional".
 * @param props.error The react-hook-form error for the field.
 * @param props.className Extra classes.
 * @param props.children The control.
 * @returns The labelled field.
 */
export const FormField = (props: {
  htmlFor: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  aside?: React.ReactNode;
  error?: HookFormFieldError;
  className?: string;
  children: React.ReactNode;
}) => (
  <div className={cn('flex flex-col gap-2', props.className)}>
    <div className="flex min-h-4 items-center justify-between gap-2">
      <Label htmlFor={props.htmlFor}>{props.label}</Label>
      {props.aside && <span className="text-xs leading-none text-ink-600">{props.aside}</span>}
    </div>
    {props.children}
    {props.error ? (
      <FieldError error={props.error} id={describedBy(props.htmlFor)} />
    ) : (
      props.hint && (
        <p id={describedBy(props.htmlFor)} className="text-[0.8125rem] text-ink-600">
          {props.hint}
        </p>
      )
    )}
  </div>
);

import { CircleAlertIcon } from 'lucide-react';

/**
 * A form-level error, written at the top of the form rather than as a toast.
 * @param props Component props.
 * @param props.children The message.
 * @returns The alert.
 */
export const FormAlert = (props: { children: React.ReactNode }) => (
  <p
    role="alert"
    className="flex items-start gap-2.5 rounded-md border border-pen/30 bg-pen/[0.06] px-3.5 py-3 text-sm font-medium text-pen"
  >
    <CircleAlertIcon aria-hidden="true" className="mt-px size-4 shrink-0" />
    {props.children}
  </p>
);

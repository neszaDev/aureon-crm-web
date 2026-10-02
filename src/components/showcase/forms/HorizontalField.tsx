import { cn } from 'cn';
import { describedBy } from '@/components/FormField';
import { Label } from '@/components/ui/label';

/**
 * A form row with the printed label beside the control from `sm` up (stacked on phones), and an
 * optional hint under the control. Pass `aria-describedby={describedBy(id)}` to the control when
 * there is a hint.
 * @param props Component props.
 * @param props.htmlFor Id of the control; omit it for a group, and pass `labelId` instead.
 * @param props.labelId Id of the label text, for a group's `aria-labelledby`.
 * @param props.label Visible label.
 * @param props.hint Help text under the control.
 * @param props.className Extra classes.
 * @param props.children The control.
 * @returns The labelled row.
 */
export const HorizontalField = (props: {
  htmlFor?: string;
  labelId?: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      'flex flex-col gap-2 sm:grid sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-4',
      props.className,
    )}
  >
    {props.htmlFor ? (
      <Label htmlFor={props.htmlFor} className="sm:min-h-10">
        {props.label}
      </Label>
    ) : (
      <span
        id={props.labelId}
        className="text-[0.6875rem] leading-none font-semibold tracking-[0.12em] text-ink-700 uppercase sm:pt-0.5"
      >
        {props.label}
      </span>
    )}
    <div className="flex min-w-0 flex-col gap-2">
      {props.children}
      {props.hint && props.htmlFor && (
        <p id={describedBy(props.htmlFor)} className="text-[0.8125rem] text-ink-600">
          {props.hint}
        </p>
      )}
    </div>
  </div>
);

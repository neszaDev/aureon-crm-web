'use client';

import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';
import { LoaderCircleIcon } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { use } from 'react';
import type { FieldError as HookFormFieldError } from 'react-hook-form';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import { InRecordPanel, usePanelId } from '@/components/crm/record/RecordPanel';
import { FieldError } from '@/components/FieldError';
import { describedBy } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SheetClose } from '@/components/ui/sheet';
import type { components } from '@/libs/api/schema';
import { Link } from '@/libs/I18nNavigation';

/**
 * A record form's name input: large and on no field surface until pointed at (its error still
 * draws the border), the field's name as its placeholder. Under Thai its line opens to 1.5, since
 * an input clips the marks stacked above and below the letters. Pass it to `Input`'s `className`.
 */
export const TITLE_INPUT =
  '-mx-2 h-auto border-transparent bg-transparent px-2 py-1 text-[1.5rem] leading-8 font-semibold tracking-[-0.01em] hover:border-transparent hover:bg-muted/70 sm:h-auto sm:text-[1.5rem] [:lang(th)_&]:leading-[1.5]';

/** The row of a record form's property chips, which wraps; their errors go under it. */
export const CHIP_ROW = 'flex flex-wrap items-center gap-1.5';

/**
 * A record form's name: its input (`TITLE_INPUT`), named for assistive technology only (its
 * placeholder says it on screen), and its error under it.
 * @param props Component props.
 * @param props.id The input's id.
 * @param props.label The field's name.
 * @param props.error The react-hook-form error for the field.
 * @param props.children The input.
 * @returns The field.
 */
export const TitleField = (props: {
  id: string;
  label: string;
  error?: HookFormFieldError;
  children: React.ReactNode;
}) => (
  <div className="flex min-w-0 flex-1 flex-col gap-1">
    <Label htmlFor={props.id} className="sr-only">
      {props.label}
    </Label>
    {props.children}
    <FieldError error={props.error} id={describedBy(props.id)} />
  </div>
);

/**
 * A record's property as a chip under its name, in the work-OS way: its icon and value (its name
 * alone, muted, while it has none), which opens its field in a popover. The value is read out
 * after the property's name ("Owner: Mia Chen"). A field error turns the chip red, is read with
 * it (`aria-describedby`) and is written, announced, under the row of chips (`CHIP_ROW`).
 * @param props Component props.
 * @param props.id The chip's id; its error's is `<id>-error`.
 * @param props.label The property, such as "Owner".
 * @param props.icon Its icon.
 * @param props.value What it holds, drawn in the chip; none for an empty property.
 * @param props.error The react-hook-form error for its field.
 * @param props.children The field, with its own label.
 * @returns The chip, and its error.
 */
export const PropertyChip = (props: {
  id: string;
  label: string;
  icon: LucideIcon;
  value?: React.ReactNode;
  error?: HookFormFieldError;
  children: React.ReactNode;
}) => {
  const t = useTranslations('ListToolbar');
  const errorId = `${props.id}-error`;
  const Icon = props.icon;

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            id={props.id}
            type="button"
            aria-describedby={props.error ? errorId : undefined}
            className={cn(
              'inline-flex h-9 max-w-full min-w-0 items-center gap-1.5 rounded-md border bg-field px-2 text-[0.8125rem] font-medium outline-none transition-colors duration-150 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-accent sm:h-8',
              props.error ? 'border-danger text-danger' : 'border-border text-foreground',
            )}
          >
            <Icon aria-hidden="true" className="size-3.5 shrink-0 opacity-70" />
            {props.value === undefined ? (
              <span className={cn('truncate', !props.error && 'text-muted-foreground')}>
                {props.label}
              </span>
            ) : (
              <>
                <span className="sr-only">{t('chip_on', { label: props.label })} </span>
                <span className="flex max-w-56 min-w-0 items-center gap-1.5">{props.value}</span>
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 max-w-[calc(100vw-2rem)]">
          {props.children}
        </PopoverContent>
      </Popover>
      {props.error && (
        <div className="order-last basis-full">
          <FieldError error={props.error} id={errorId} label={props.label} />
        </div>
      )}
    </>
  );
};

/**
 * A person as a chip's value: their avatar and name ("(you)" for the caller), or "Unassigned".
 * @param props Component props.
 * @param props.members The workspace's members.
 * @param props.me The caller's user id.
 * @param props.userId The person, or null for none.
 * @returns The value.
 */
export const PersonValue = (props: {
  members: components['schemas']['MemberRef'][];
  me: number;
  userId: number | null;
}) => {
  const t = useTranslations('OwnerField');
  const person = props.members.find((member) => member.userId === props.userId);
  if (!person) {
    return t('unassigned');
  }
  const name = person.displayName ?? person.email;

  return (
    <>
      <PersonAvatar person={person} size="xs" />
      <span className="truncate">{person.userId === props.me ? t('you', { name }) : name}</span>
    </>
  );
};

/**
 * A lead source as a chip's value: its name, or nothing for none.
 * @param sources The workspace's lead sources.
 * @param id The source, or null.
 * @returns The value.
 */
export const sourceValue = (
  sources: components['schemas']['LeadSourceResponse'][],
  id: number | null,
) => {
  const name = sources.find((source) => source.id === id)?.name;

  return name === undefined ? undefined : <span className="truncate">{name}</span>;
};

/**
 * A day, or a day and time, as a chip's value: as typed in the workspace's zone, shown as is.
 * @param props Component props.
 * @param props.value `YYYY-MM-DD`, or `YYYY-MM-DDTHH:mm`.
 * @returns The date.
 */
export const DateValue = (props: { value: string }) => {
  const format = useFormatter();
  const dateOnly = props.value.length === 10;

  return (
    <span className="truncate">
      {format.dateTime(new Date(`${props.value}${dateOnly ? 'T00:00' : ''}:00Z`), {
        dateStyle: 'medium',
        timeStyle: dateOnly ? undefined : 'short',
        timeZone: 'UTC',
      })}
    </span>
  );
};

/**
 * A record form's other fields, under a hairline below its chips.
 * @param props Component props.
 * @param props.id The heading's id (`usePanelId`).
 * @param props.children The fields.
 * @returns The section.
 */
export const FormDetails = (props: { id: string; children: React.ReactNode }) => {
  const t = useTranslations('RecordForm');
  const id = usePanelId(props.id);

  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 border-t border-rule pt-5">
      <h2 id={id} className="text-[0.8125rem] font-semibold text-muted-foreground">
        {t('details')}
      </h2>
      {props.children}
    </section>
  );
};

/**
 * A record form's end: its submit (spinning while it saves), Cancel and the "Saved" it says
 * after an edit. In a record panel (a new record's form), Cancel closes the panel; on a page it
 * goes back where the form was opened from.
 * @param props Component props.
 * @param props.submitLabel The submit button's label.
 * @param props.cancelLabel Cancel's label.
 * @param props.cancelHref Where Cancel goes on a page.
 * @param props.submitting Whether a save is on its way.
 * @param props.saved What says the last save went through, or nothing.
 * @returns The actions.
 */
export const FormActions = (props: {
  submitLabel: string;
  cancelLabel: string;
  cancelHref: string;
  submitting: boolean;
  saved?: string;
}) => {
  const inPanel = use(InRecordPanel);
  const cancel = (
    <Button type="button" variant="ghost">
      {props.cancelLabel}
    </Button>
  );

  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-5">
      <Button type="submit" disabled={props.submitting}>
        {props.submitting && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
        {props.submitLabel}
      </Button>
      {inPanel ? (
        <SheetClose asChild>{cancel}</SheetClose>
      ) : (
        <Button asChild variant="ghost">
          <Link href={props.cancelHref}>{props.cancelLabel}</Link>
        </Button>
      )}
      <output className="text-sm font-medium text-success">{props.saved}</output>
    </div>
  );
};

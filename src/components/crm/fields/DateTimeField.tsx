'use client';

import { cn } from 'cn';
import { enUS, fr, th } from 'date-fns/locale';
import { CalendarIcon, XIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { FieldError as HookFormFieldError } from 'react-hook-form';
import { FieldError } from '@/components/FieldError';
import { describedBy } from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { fieldStates, fieldSurface } from '@/components/ui/field-surface';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatDate } from '@/libs/crm/Format';
import { toLocalInput } from '@/libs/crm/ZonedTime';

const CALENDAR_LOCALES: Record<string, typeof enUS> = { en: enUS, fr, th };
// The time a picked day starts with when none was typed yet.
const DEFAULT_TIME = '09:00';

/**
 * A `YYYY-MM-DD` day as the calendar's local midnight, so the day never shifts with a zone.
 * @param day The day.
 * @returns The date, or undefined without a day.
 */
const toCalendarDay = (day: string) => {
  const [year = 0, month = 1, date = 1] = day.split('-').map(Number);
  return day ? new Date(year, month - 1, date) : undefined;
};

/**
 * The calendar's local day as `YYYY-MM-DD`.
 * @param date The picked date.
 * @returns The day.
 */
const fromCalendarDay = (date: Date) =>
  [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');

/**
 * A date and time in the workspace's time zone, for a form that controls it (react-hook-form
 * `Controller`): a day from a calendar in a popover and a time input, the zone named under them.
 * The value is `YYYY-MM-DDTHH:mm` in that zone (empty for none); `toInstant` makes it an instant
 * on submit and `toLocalInput` makes a saved one a value. A day picked without a time starts at
 * 09:00; a time typed without a day is today's, there.
 * @param props Component props.
 * @param props.id The day button's id; the label points at it.
 * @param props.label The field's label.
 * @param props.value The local date and time, or empty.
 * @param props.onChange Called with the new value.
 * @param props.timeZone The workspace's time zone.
 * @param props.clearable Whether "no date" is a value (a "Clear" button empties it).
 * @param props.error The field's error.
 * @returns The field.
 */
export const DateTimeField = (props: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  timeZone: string;
  clearable?: boolean;
  error?: HookFormFieldError;
}) => {
  const t = useTranslations('DateTimeField');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [day = '', time = ''] = props.value.split('T');
  const selected = toCalendarDay(day);
  const labelId = `${props.id}-label`;
  const timeLabelId = `${props.id}-time-label`;
  const descriptionId = describedBy(props.id);
  const invalid = props.error ? true : undefined;

  return (
    <div className="flex flex-col gap-2">
      <Label id={labelId} htmlFor={props.id}>
        {props.label}
      </Label>
      <div className="flex flex-wrap gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              id={props.id}
              type="button"
              aria-labelledby={`${labelId} ${props.id}`}
              aria-describedby={descriptionId}
              className={cn(
                fieldSurface,
                fieldStates,
                'flex h-10 min-w-40 flex-1 items-center gap-2 px-3 text-left',
                // A button takes no aria-invalid: the error, under the field, describes it.
                props.error && 'border-destructive ring-3 ring-destructive/15',
              )}
            >
              <CalendarIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <span className={cn('truncate', !selected && 'text-muted-foreground')}>
                {selected ? formatDate(day, locale) : t('pick_date')}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent aria-label={props.label} align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              required
              autoFocus
              selected={selected}
              defaultMonth={selected}
              locale={CALENDAR_LOCALES[locale] ?? enUS}
              // The month as the rest of the page writes dates (Thai: the Buddhist year).
              formatters={{
                formatCaption: (month) =>
                  new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month),
              }}
              onSelect={(date) => {
                props.onChange(`${fromCalendarDay(date)}T${time || DEFAULT_TIME}`);
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
        <span id={timeLabelId} className="sr-only">
          {t('time')}
        </span>
        <Input
          type="time"
          value={time}
          aria-labelledby={`${labelId} ${timeLabelId}`}
          aria-describedby={descriptionId}
          aria-invalid={invalid}
          className="w-36"
          onChange={(event) => {
            const next = event.currentTarget.value;
            // Today in the workspace's zone, for a time typed before any day.
            const today = toLocalInput(new Date().toISOString(), props.timeZone).slice(0, 10);
            props.onChange(next || day ? `${day || today}T${next}` : '');
          }}
        />
        {props.clearable && props.value && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t('clear', { label: props.label })}
            onClick={() => {
              props.onChange('');
              // The button goes with the value: the focus stays in the field.
              document.querySelector<HTMLElement>(`#${CSS.escape(props.id)}`)?.focus();
            }}
          >
            <XIcon />
          </Button>
        )}
      </div>
      {props.error ? (
        <FieldError error={props.error} id={descriptionId} />
      ) : (
        <p id={descriptionId} className="text-[0.8125rem] text-muted-foreground">
          {t('zone', { zone: props.timeZone.replaceAll('_', ' ') })}
        </p>
      )}
    </div>
  );
};

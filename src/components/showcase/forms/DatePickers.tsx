'use client';

import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const useCalendarLocale = () => (useLocale() === 'fr' ? fr : enUS);

// Calendar days are local dates, so they are printed in local time (no time zone shift).
const printDate = (date: Date, locale: typeof enUS) => format(date, 'PP', { locale });

// As on the Vue page: the 7th to the 11th of the current month.
const initialRange = (): DateRange => {
  const today = new Date();
  return {
    from: new Date(today.getFullYear(), today.getMonth(), 7),
    to: new Date(today.getFullYear(), today.getMonth(), 11),
  };
};

/**
 * An inline range calendar with the chosen start and end printed under it.
 * @returns The calendar and its readout.
 */
export const RangeCalendarDemo = () => {
  const t = useTranslations('AdvancedFormsPage');
  const locale = useCalendarLocale();
  const [range, setRange] = useState<DateRange | undefined>(initialRange);
  const show = (date?: Date) => (date ? printDate(date, locale) : '—');

  return (
    <div className="flex flex-col gap-4">
      <Calendar
        mode="range"
        selected={range}
        onSelect={setRange}
        defaultMonth={range?.from}
        locale={locale}
        className="rounded-md border border-ink-300 bg-ply shadow-ply"
      />
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[0.9375rem] tabular-nums">
        <dt className="text-[0.6875rem] leading-6 font-semibold tracking-[0.12em] text-ink-600 uppercase">
          {t('range_start')}
        </dt>
        <dd className="text-ink-900">{show(range?.from)}</dd>
        <dt className="text-[0.6875rem] leading-6 font-semibold tracking-[0.12em] text-ink-600 uppercase">
          {t('range_end')}
        </dt>
        <dd className="text-ink-900">{show(range?.to)}</dd>
      </dl>
    </div>
  );
};

/**
 * Two date fields that open a calendar in a popover: a single date and a date range.
 * @returns The fields.
 */
export const PopoverDatePickers = () => {
  const t = useTranslations('AdvancedFormsPage');
  const locale = useCalendarLocale();
  const [date, setDate] = useState<Date>();
  const [dateOpen, setDateOpen] = useState(false);
  const [range, setRange] = useState<DateRange>();
  const show = (value: Date) => printDate(value, locale);

  let rangeText = t('pick_range');
  if (range?.from) {
    rangeText = range.to
      ? t('date_range', { start: show(range.from), end: show(range.to) })
      : show(range.from);
  }

  return (
    <div className="grid gap-5 border-t border-ink-200 pt-6 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <Label htmlFor="date-single">{t('single_date_label')}</Label>
        <Popover open={dateOpen} onOpenChange={setDateOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-single"
              type="button"
              variant="outline"
              className="h-10 justify-start font-normal tabular-nums"
            >
              <CalendarIcon aria-hidden="true" data-icon="inline-start" className="text-ink-600" />
              <span className={date ? 'text-ink-900' : 'text-ink-400'}>
                {date ? show(date) : t('pick_date')}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(next) => {
                setDate(next);
                setDateOpen(false);
              }}
              defaultMonth={date}
              locale={locale}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="date-range">{t('range_label')}</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-range"
              type="button"
              variant="outline"
              className="h-10 justify-start font-normal tabular-nums"
            >
              <CalendarIcon aria-hidden="true" data-icon="inline-start" className="text-ink-600" />
              <span className={`truncate ${range?.from ? 'text-ink-900' : 'text-ink-400'}`}>
                {rangeText}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              mode="range"
              selected={range}
              onSelect={setRange}
              defaultMonth={range?.from}
              numberOfMonths={2}
              locale={locale}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

'use client';

import { cn } from 'cn';
import { CalendarIcon, CheckIcon, ChevronDownIcon, TriangleAlertIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { DateTimeField } from '@/components/crm/fields/DateTimeField';
import { TOOL_PART, toolClass } from '@/components/crm/list/FilterChip';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Spinner } from '@/components/ui/spinner';
import { formatPeriod } from '@/libs/crm/Format';
import type { PeriodQuery } from '@/libs/crm/PeriodQuery';
import { parsePeriod, periodHref, periodPresets } from '@/libs/crm/PeriodQuery';
import { Link, useRouter } from '@/libs/I18nNavigation';

/**
 * Picks the period a page reports on, from a toolbar chip: Last 7, 30 or 90 days, This month,
 * Last month (counted in the workspace's time zone, each a link) or a custom range (two days,
 * applied with a button).
 * The button shows the period the API answered with, so the label is always the range the
 * figures are for, whatever the URL asked. Last 30 days is the default and leaves the dates out
 * of the URL. A custom range the API would refuse (the end before the start, or more than 366
 * days) can't be applied, and the picker says why. Choosing a period closes the picker and goes
 * through a transition: until the page answers, the button shows a spinner and `aria-busy`, Apply
 * is off, and the label stays the period the figures are for, never the one asked.
 * @param props Component props.
 * @param props.period The response's `period`.
 * @param props.path The page's path.
 * @param props.params The page's other URL params, which a new period keeps (such as a tab).
 * @param props.today Today in the workspace's time zone, `YYYY-MM-DD`.
 * @param props.timeZone The workspace's time zone.
 * @returns The picker.
 */
export const PeriodPicker = (props: {
  period: { from: string; to: string };
  path: string;
  params: Record<string, string | string[]>;
  today: string;
  timeZone: string;
}) => {
  const t = useTranslations('PeriodPicker');
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(props.period.from);
  const [to, setTo] = useState(props.period.to);
  const label = formatPeriod(props.period, locale);
  const chosen = parsePeriod({ from, to });
  const valid = chosen.from !== undefined && chosen.to !== undefined;
  // Without a period: the default one, with no dates in the URL.
  const go = (period?: PeriodQuery) => {
    setOpen(false);
    startTransition(() => {
      router.push(periodHref(props.path, props.params, period), { scroll: false });
    });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        // A range left half-edited is not what the page shows.
        setFrom(props.period.from);
        setTo(props.period.to);
      }}
    >
      <PopoverTrigger asChild>
        {/* A toolbar chip, as the lists' filters: always on, since a page always has a period. */}
        <button
          type="button"
          aria-label={t('trigger', { period: label })}
          aria-busy={isPending}
          className={cn(
            toolClass(false),
            TOOL_PART,
            'aria-expanded:bg-black/5 dark:aria-expanded:bg-white/8',
          )}
        >
          {isPending ? (
            <Spinner aria-hidden="true" className="size-3.5" />
          ) : (
            <CalendarIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate tabular-nums">{label}</span>
          <ChevronDownIcon aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        // On a short window the sheet scrolls inside the room Radix leaves, so Apply is never
        // out of reach.
        className="max-h-(--radix-popover-content-available-height) w-80 max-w-[calc(100vw-2rem)] gap-3 overflow-y-auto p-3"
      >
        <nav aria-label={t('presets')}>
          <ul className="flex flex-col">
            {periodPresets(props.today).map((preset) => {
              const current =
                preset.period.from === props.period.from && preset.period.to === props.period.to;
              // The last 30 days are what the API answers without dates.
              const period = preset.key === 'last30' ? undefined : preset.period;

              return (
                <li key={preset.key}>
                  <Link
                    href={periodHref(props.path, props.params, period)}
                    aria-current={current ? 'true' : undefined}
                    scroll={false}
                    className={cn(
                      'flex min-h-9 items-center justify-between gap-2 rounded-md px-2 text-sm text-foreground no-underline transition-colors duration-150 hover:bg-muted',
                      current && 'bg-muted font-semibold',
                    )}
                    onClick={(event) => {
                      // A plain click goes through the transition; a new tab or window keeps the link.
                      if (
                        event.button === 0 &&
                        !event.metaKey &&
                        !event.ctrlKey &&
                        !event.shiftKey &&
                        !event.altKey
                      ) {
                        event.preventDefault();
                        go(period);
                      }
                    }}
                  >
                    {t(`preset_${preset.key}`)}
                    {current && <CheckIcon aria-hidden="true" className="size-4 shrink-0" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-rule pt-3">
          <fieldset className="flex min-w-0 flex-col gap-3">
            <legend className="mb-3 font-medium">{t('custom')}</legend>
            <DateTimeField
              id="period-from"
              label={t('from')}
              value={from}
              onChange={setFrom}
              timeZone={props.timeZone}
              dateOnly
            />
            <DateTimeField
              id="period-to"
              label={t('to')}
              value={to}
              onChange={setTo}
              timeZone={props.timeZone}
              dateOnly
            />
            {!valid && (
              <p className="flex items-start gap-2 text-sm text-danger">
                <TriangleAlertIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                {t('invalid')}
              </p>
            )}
            <p className="text-[0.8125rem] text-muted-foreground">
              {t('zone', { zone: props.timeZone.replaceAll('_', ' ') })}
            </p>
            <Button
              disabled={!valid || isPending}
              onClick={() => {
                go(chosen);
              }}
            >
              {t('apply')}
            </Button>
          </fieldset>
        </div>
      </PopoverContent>
    </Popover>
  );
};

'use client';

import { cn } from 'cn';
import { CalendarIcon, ChevronDownIcon, TriangleAlertIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { DateTimeField } from '@/components/crm/fields/DateTimeField';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatPeriod } from '@/libs/crm/Format';
import { parsePeriod, periodHref, periodPresets } from '@/libs/crm/PeriodQuery';
import { Link, useRouter } from '@/libs/I18nNavigation';

/**
 * Picks the period a page reports on: Last 7, 30 or 90 days, This month, Last month (counted in
 * the workspace's time zone, each a link) or a custom range (two days, applied with a button).
 * The button shows the period the API answered with, so the label is always the range the
 * figures are for, whatever the URL asked. Last 30 days is the default and leaves the dates out
 * of the URL. A custom range the API would refuse (the end before the start, or more than 366
 * days) can't be applied, and the picker says why.
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
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState(props.period.from);
  const [to, setTo] = useState(props.period.to);
  const label = formatPeriod(props.period, locale);
  const chosen = parsePeriod({ from, to });
  const valid = chosen.from !== undefined && chosen.to !== undefined;

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
        <Button variant="outline" size="sm" aria-label={t('trigger', { period: label })}>
          <CalendarIcon aria-hidden="true" />
          <span className="tabular-nums">{label}</span>
          <ChevronDownIcon aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] gap-3 p-3">
        <nav aria-label={t('presets')}>
          <ul className="flex flex-col">
            {periodPresets(props.today).map((preset) => {
              const current =
                preset.period.from === props.period.from && preset.period.to === props.period.to;

              return (
                <li key={preset.key}>
                  <Link
                    href={periodHref(
                      props.path,
                      props.params,
                      // The last 30 days are what the API answers without dates.
                      preset.key === 'last30' ? undefined : preset.period,
                    )}
                    aria-current={current ? 'true' : undefined}
                    scroll={false}
                    className={cn(
                      'flex min-h-9 items-center rounded-md px-2 text-sm text-foreground no-underline transition-colors duration-150 hover:bg-muted',
                      current && 'bg-seal-tint font-semibold',
                    )}
                    onClick={() => {
                      setOpen(false);
                    }}
                  >
                    {t(`preset_${preset.key}`)}
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
              disabled={!valid}
              onClick={() => {
                setOpen(false);
                router.push(periodHref(props.path, props.params, chosen), { scroll: false });
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

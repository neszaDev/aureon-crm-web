'use client';

import { useTranslations } from 'next-intl';
import { Combobox } from '@/components/Combobox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { FilterOption, QuickRange } from './filters';
import { QUICK_RANGES, quickRange } from './filters';

/** What the organisation filter emits. Dates are `yyyy-MM-dd`, both days included. */
export type OrganizationFilterValue = {
  organization: string | null;
  agency: string | null;
  department: string | null;
  range: QuickRange | null;
  startDate: string;
  endDate: string;
};

const UNITS = ['organization', 'agency', 'department'] as const;

/**
 * The organisation filter (Vue `FilterOrganization`): searchable organisation, agency and
 * department selects, quick date ranges and start/end dates (the date row was commented out in
 * Vue). Typing a date clears the quick range.
 * @param props Component props.
 * @param props.options Choices for each select, labelled in the current language.
 * @param props.options.organization Organisation choices.
 * @param props.options.agency Agency choices.
 * @param props.options.department Department choices.
 * @param props.value The current filter.
 * @param props.onChange Called with the whole new filter.
 * @param props.disabled Whether the fields are locked.
 * @returns The filter fields.
 */
export const OrganizationFilter = (props: {
  options: Record<(typeof UNITS)[number], FilterOption[]>;
  value: OrganizationFilterValue;
  onChange: (value: OrganizationFilterValue) => void;
  disabled?: boolean;
}) => {
  const t = useTranslations('CampusFilters');

  return (
    <div className="flex flex-col gap-4">
      {UNITS.map((unit) => (
        <div key={unit} className="grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center">
          <Label htmlFor={`filter-${unit}`}>{t(unit)}</Label>
          <Combobox
            id={`filter-${unit}`}
            options={props.options[unit]}
            value={props.value[unit] ? [props.value[unit]] : []}
            onValueChange={(ids) => {
              props.onChange({ ...props.value, [unit]: ids[0] ?? null });
            }}
            clearable
            placeholder={t('choose')}
            searchPlaceholder={t('search')}
            disabled={props.disabled}
          />
        </div>
      ))}

      <fieldset className="grid gap-2 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-start">
        <legend className="sr-only">{t('dates')}</legend>
        <span
          aria-hidden="true"
          className="text-[0.6875rem] leading-none font-semibold tracking-[0.12em] text-ink-700 uppercase sm:pt-3.5"
        >
          {t('dates')}
        </span>
        <div className="flex flex-col gap-3">
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={props.value.range ?? ''}
            onValueChange={(next) => {
              const range = QUICK_RANGES.find((id) => id === next);
              if (range) {
                const days = quickRange(range, new Date());
                props.onChange({ ...props.value, range, startDate: days.start, endDate: days.end });
              }
            }}
            disabled={props.disabled}
            aria-label={t('quick_ranges')}
            className="flex-wrap"
          >
            {QUICK_RANGES.map((range) => (
              <ToggleGroupItem key={range} value={range}>
                {t(`range_${range}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              aria-label={t('start_date')}
              value={props.value.startDate}
              max={props.value.endDate || undefined}
              disabled={props.disabled}
              onChange={(event) => {
                props.onChange({ ...props.value, range: null, startDate: event.target.value });
              }}
              className="w-auto tabular-nums"
            />
            <span aria-hidden="true" className="text-ink-600">
              –
            </span>
            <Input
              type="date"
              aria-label={t('end_date')}
              value={props.value.endDate}
              min={props.value.startDate || undefined}
              disabled={props.disabled}
              onChange={(event) => {
                props.onChange({ ...props.value, range: null, endDate: event.target.value });
              }}
              className="w-auto tabular-nums"
            />
          </div>
        </div>
      </fieldset>
    </div>
  );
};

'use client';

import { useFormatter, useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { OrgUnit } from '@/libs/api/CampusPlaceholders';
import type { CourseOptionValue } from './CourseOptionFilter';
import { CourseOptionFilter } from './CourseOptionFilter';
import type { FilterOption } from './filters';
import { buddhistYear, buildOptions, quickRange } from './filters';
import type { OrganizationFilterValue } from './OrganizationFilter';
import { OrganizationFilter } from './OrganizationFilter';

/**
 * The emitted value, as a term list under the filter.
 * @param props Component props.
 * @param props.rows Each term and its value.
 * @param props.value The raw emitted object.
 * @returns The summary.
 */
const Summary = (props: { rows: { term: string; value: React.ReactNode }[]; value: object }) => {
  const t = useTranslations('CampusFilters');

  return (
    <section
      aria-label={t('summary_title')}
      className="flex flex-col gap-3 rounded-md border border-ink-200 bg-paper px-4 py-3"
    >
      <h3 className="text-[0.6875rem] font-semibold tracking-[0.12em] text-ink-700 uppercase">
        {t('summary_title')}
      </h3>
      <dl className="grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[9rem_minmax(0,1fr)]">
        {props.rows.map((row) => (
          <div key={row.term} className="contents">
            <dt className="text-ink-600">{row.term}</dt>
            <dd className="font-semibold break-words text-ink-900">{row.value}</dd>
          </div>
        ))}
      </dl>
      <pre className="overflow-x-auto rounded-sm bg-ply px-3 py-2 font-mono text-xs text-ink-700">
        {JSON.stringify(props.value, null, 2)}
      </pre>
    </section>
  );
};

const labelOf = (options: FilterOption[], value: string | null) =>
  options.find((option) => option.value === value)?.label;

/**
 * The organisation filter with the selection it emits. The first organisation is chosen up
 * front and the range starts on today, as in Vue.
 * @param props Component props.
 * @param props.units Organisations, agencies and departments with their titles.
 * @param props.units.organizations Organisations.
 * @param props.units.agencies Agencies.
 * @param props.units.departments Departments.
 * @returns The filter and its summary.
 */
export const OrganizationFilterPanel = (props: {
  units: { organizations: OrgUnit[]; agencies: OrgUnit[]; departments: OrgUnit[] };
}) => {
  const t = useTranslations('CampusFilters');
  const format = useFormatter();
  const locale = useLocale();
  const [value, setValue] = useState<OrganizationFilterValue>(() => {
    const today = quickRange('today', new Date());

    return {
      organization: props.units.organizations[0]?._id ?? null,
      agency: null,
      department: null,
      range: 'today',
      startDate: today.start,
      endDate: today.end,
    };
  });
  const options = {
    organization: buildOptions(props.units.organizations, locale),
    agency: buildOptions(props.units.agencies, locale),
    department: buildOptions(props.units.departments, locale),
  };
  const day = (date: string) =>
    date
      ? format.dateTime(new Date(`${date}T00:00:00Z`), { dateStyle: 'medium', timeZone: 'UTC' })
      : t('none');

  return (
    <div className="flex flex-col gap-6">
      <OrganizationFilter options={options} value={value} onChange={setValue} />
      <Summary
        value={value}
        rows={[
          {
            term: t('organization'),
            value: labelOf(options.organization, value.organization) ?? t('none'),
          },
          { term: t('agency'), value: labelOf(options.agency, value.agency) ?? t('none') },
          {
            term: t('department'),
            value: labelOf(options.department, value.department) ?? t('none'),
          },
          {
            term: t('dates'),
            value: t('date_range', { start: day(value.startDate), end: day(value.endDate) }),
          },
        ]}
      />
    </div>
  );
};

/**
 * The course option filter with the option object it emits and a switch that locks it.
 * @param props Component props.
 * @param props.universities Universities with their titles.
 * @returns The filter and its summary.
 */
export const CourseOptionPanel = (props: { universities: OrgUnit[] }) => {
  const t = useTranslations('CampusFilters');
  const locale = useLocale();
  const universities = buildOptions(props.universities, locale);
  const [locked, setLocked] = useState(false);
  const [value, setValue] = useState<CourseOptionValue>(() => ({
    campusId: props.universities[0]?._id ?? null,
    academicYear: buddhistYear(new Date()),
    semester: 1,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Switch id="option-locked" checked={locked} onCheckedChange={setLocked} />
        <Label htmlFor="option-locked">{t('lock')}</Label>
      </div>
      <CourseOptionFilter
        universities={universities}
        value={value}
        onChange={setValue}
        disabled={locked}
      />
      <Summary
        value={value}
        rows={[
          { term: t('university'), value: labelOf(universities, value.campusId) ?? t('none') },
          { term: t('academic_year'), value: value.academicYear ?? t('none') },
          { term: t('semester'), value: t('semester_option', { semester: value.semester }) },
        ]}
      />
    </div>
  );
};

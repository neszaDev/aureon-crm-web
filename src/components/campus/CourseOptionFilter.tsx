'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import type { FilterOption } from './filters';

/** Semesters of the Thai academic year. */
const SEMESTERS = [1, 2, 3] as const;

type Semester = (typeof SEMESTERS)[number];

/** What the course option filter emits (Vue `FilterOption`'s `option` event). */
export type CourseOptionValue = {
  campusId: string | null;
  academicYear: number | null;
  semester: Semester;
};

/**
 * The course option filter (Vue `FilterOption`): university, academic year (Buddhist Era)
 * and semester. Every change emits the whole option object.
 * @param props Component props.
 * @param props.universities University choices, labelled in the current language.
 * @param props.value The current option.
 * @param props.onChange Called with the whole new option.
 * @param props.disabled Whether the fields are locked.
 * @returns The filter fields.
 */
export const CourseOptionFilter = (props: {
  universities: FilterOption[];
  value: CourseOptionValue;
  onChange: (value: CourseOptionValue) => void;
  disabled?: boolean;
}) => {
  const t = useTranslations('CampusFilters');

  return (
    <div className="grid gap-x-4 gap-y-5 sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="option-university">{t('university')}</Label>
        <NativeSelect
          id="option-university"
          value={props.value.campusId ?? ''}
          disabled={props.disabled}
          onChange={(event) => {
            props.onChange({ ...props.value, campusId: event.target.value });
          }}
        >
          {props.universities.map((option) => (
            <NativeSelectOption key={option.value} value={option.value}>
              {option.label}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="option-year">{t('academic_year')}</Label>
        <Input
          id="option-year"
          type="number"
          inputMode="numeric"
          min={2500}
          max={2700}
          className="tabular-nums"
          value={props.value.academicYear ?? ''}
          disabled={props.disabled}
          onChange={(event) => {
            props.onChange({
              ...props.value,
              academicYear: event.target.value === '' ? null : event.target.valueAsNumber,
            });
          }}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="option-semester">{t('semester')}</Label>
        <NativeSelect
          id="option-semester"
          value={props.value.semester}
          disabled={props.disabled}
          onChange={(event) => {
            const semester = SEMESTERS.find((value) => String(value) === event.target.value);
            if (semester) {
              props.onChange({ ...props.value, semester });
            }
          }}
        >
          {SEMESTERS.map((semester) => (
            <NativeSelectOption key={semester} value={semester}>
              {t('semester_option', { semester })}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
};

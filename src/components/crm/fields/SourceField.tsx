'use client';

import { useTranslations } from 'next-intl';
import type { FieldError as HookFormFieldError } from 'react-hook-form';
import { FieldError } from '@/components/FieldError';
import { describedBy } from '@/components/FormField';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { components } from '@/libs/api/schema';

// The "None" option's value: a select item can't have an empty one.
const NONE = 'none';

/**
 * Where a record came from, for a form that controls it (react-hook-form `Controller`): "None"
 * or one of the workspace's lead sources. Archived sources aren't offered, except the record's
 * own, which stays chosen until changed.
 * @param props Component props.
 * @param props.id The select's id.
 * @param props.label The field's label.
 * @param props.value The source's id, or null for none.
 * @param props.onChange Called with the chosen source.
 * @param props.sources Every lead source, archived ones included.
 * @param props.error The backend's refusal of the source.
 * @returns The field.
 */
export const SourceField = (props: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
  sources: components['schemas']['LeadSourceResponse'][];
  error?: HookFormFieldError;
}) => {
  const t = useTranslations('SourceField');
  const options = props.sources.filter((source) => !source.archived || source.id === props.value);

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Select
        value={props.value === null ? NONE : String(props.value)}
        onValueChange={(next) => {
          props.onChange(next === NONE ? null : Number(next));
        }}
      >
        <SelectTrigger
          id={props.id}
          aria-invalid={props.error ? true : undefined}
          aria-describedby={props.error ? describedBy(props.id) : undefined}
          className="w-full"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          <SelectItem value={NONE}>{t('none')}</SelectItem>
          {options.map((source) => (
            <SelectItem key={source.id} value={String(source.id)}>
              {source.archived ? t('archived', { name: source.name }) : source.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError error={props.error} id={describedBy(props.id)} />
    </div>
  );
};

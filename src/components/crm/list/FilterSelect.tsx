'use client';

import { Seal } from '@/components/crm/Seal';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import { useRouter } from '@/libs/I18nNavigation';

// The "Any" option's value: a select item can't have an empty one. No filter value is this.
const ANY = '*';

/** One option of a filter; a person shows with their seal. */
export type FilterOption = {
  value: string;
  label: string;
  person?: { displayName?: string; email: string };
};

/**
 * A filter of a list that sets one URL param, with an "Any" option that removes it. Choosing
 * keeps the other params and goes back to the first page.
 * @param props Component props.
 * @param props.id The trigger's id.
 * @param props.label Its visible label.
 * @param props.anyLabel The label of the option without a filter.
 * @param props.param The URL param it sets.
 * @param props.options The values, in order.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @returns The labelled select.
 */
export const FilterSelect = (props: {
  id: string;
  label: string;
  anyLabel: string;
  param: string;
  options: FilterOption[];
  path: string;
  query: ListQuery;
}) => {
  const router = useRouter();
  const current = props.query.params[props.param];

  return (
    <div className="flex min-w-44 flex-1 basis-48 flex-col gap-2 sm:flex-none">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Select
        value={typeof current === 'string' ? current : ANY}
        onValueChange={(next) => {
          router.push(
            listHref(props.path, props.query, { [props.param]: next === ANY ? undefined : next }),
            { scroll: false },
          );
        }}
      >
        <SelectTrigger id={props.id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          <SelectItem value={ANY}>{props.anyLabel}</SelectItem>
          {props.options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.person && (
                <Seal name={option.person.displayName} email={option.person.email} size="sm" />
              )}
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

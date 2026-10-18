'use client';

import { useTranslations } from 'next-intl';
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

/**
 * Chooses a list's sort from a select, for a sort no column shows (a deal's creation date): it
 * takes the sort's own direction, which the column heads then flip. Keeps the other params and
 * goes back to the first page.
 * @param props Component props.
 * @param props.id The trigger's id.
 * @param props.options Each sort and its label, the default one first.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @returns The labelled select.
 */
export const SortSelect = (props: {
  id: string;
  options: { sort: string; label: string }[];
  path: string;
  query: ListQuery;
}) => {
  const t = useTranslations('RecordList');
  const router = useRouter();
  const [first] = props.options;

  return (
    <div className="flex min-w-44 flex-1 basis-48 flex-col gap-2 sm:flex-none">
      <Label htmlFor={props.id}>{t('sort_label')}</Label>
      <Select
        value={props.query.sort}
        onValueChange={(next) => {
          router.push(
            listHref(props.path, props.query, {
              sort: next === first?.sort ? undefined : next,
              direction: undefined,
            }),
            { scroll: false },
          );
        }}
      >
        <SelectTrigger id={props.id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {props.options.map((option) => (
            <SelectItem key={option.sort} value={option.sort}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

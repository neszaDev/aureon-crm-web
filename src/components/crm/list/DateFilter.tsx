'use client';

import { DateTimeField } from '@/components/crm/fields/DateTimeField';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import { useRouter } from '@/libs/I18nNavigation';

/**
 * A filter of a list by a day (a lead's "follow-up before"): a calendar field that sets one URL
 * param to `YYYY-MM-DD`, keeping the other params and going back to the first page. Clearing it
 * removes the param.
 * @param props Component props.
 * @param props.id The day button's id.
 * @param props.label Its visible label.
 * @param props.param The URL param it sets.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @param props.timeZone The workspace's time zone.
 * @returns The labelled filter.
 */
export const DateFilter = (props: {
  id: string;
  label: string;
  param: string;
  path: string;
  query: ListQuery;
  timeZone: string;
}) => {
  const router = useRouter();
  const current = props.query.params[props.param];

  return (
    <div className="min-w-44 flex-1 basis-48 sm:flex-none">
      <DateTimeField
        id={props.id}
        label={props.label}
        value={typeof current === 'string' ? current : ''}
        timeZone={props.timeZone}
        clearable
        dateOnly
        onChange={(next) => {
          router.push(listHref(props.path, props.query, { [props.param]: next || undefined }), {
            scroll: false,
          });
        }}
      />
    </div>
  );
};

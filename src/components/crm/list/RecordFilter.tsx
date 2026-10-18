'use client';

import type { RecordKind } from '@/actions/crm/RecordSearchActions';
import type { PickedRecord } from '@/components/crm/fields/RecordPicker';
import { RecordPicker } from '@/components/crm/fields/RecordPicker';
import { Label } from '@/components/ui/label';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import { useRouter } from '@/libs/I18nNavigation';

/**
 * A filter of a list by a linked record (a contact's company): a `RecordPicker` that sets one
 * URL param to the record's id, keeping the other params and going back to the first page.
 * Clearing it removes the param.
 * @param props Component props.
 * @param props.id The field's id.
 * @param props.label Its visible label.
 * @param props.placeholder What it says without a record, such as "Any company".
 * @param props.workspaceId The workspace searched.
 * @param props.kind The kind of record.
 * @param props.param The URL param it sets.
 * @param props.value The record in the URL, with its name, or null.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @returns The labelled filter.
 */
export const RecordFilter = (props: {
  id: string;
  label: string;
  placeholder: string;
  workspaceId: number;
  kind: RecordKind;
  param: string;
  value: PickedRecord | null;
  path: string;
  query: ListQuery;
}) => {
  const router = useRouter();

  return (
    <div className="flex min-w-44 flex-1 basis-48 flex-col gap-2 sm:flex-none">
      <Label htmlFor={props.id}>{props.label}</Label>
      <RecordPicker
        id={props.id}
        workspaceId={props.workspaceId}
        kind={props.kind}
        value={props.value}
        placeholder={props.placeholder}
        onChange={(next) => {
          router.push(
            listHref(props.path, props.query, {
              [props.param]: next ? String(next.id) : undefined,
            }),
            { scroll: false },
          );
        }}
      />
    </div>
  );
};

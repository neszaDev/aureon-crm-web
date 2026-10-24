'use client';

import { cn } from 'cn';
import { useTranslations } from 'next-intl';
import { createContext, use, useId, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableHead } from '@/components/ui/table';
import type { BulkItem } from '@/libs/crm/BulkSelection';
import {
  emptySelection,
  liveSelection,
  sectionState,
  selectRange,
  toggle,
  toggleSection,
} from '@/libs/crm/BulkSelection';

/**
 * A list's selection, kept to the rows on screen and cleared when the list's state changes.
 * @param scope The list's state (its URL query).
 * @param items The rows on screen.
 * @param headingId The list's heading, which takes the focus when the bar goes with it.
 * @returns The rows selected, and what changes them.
 */
export const useSelection = (scope: string, items: BulkItem[], headingId: string) => {
  const [selection, setSelection] = useState(() => emptySelection(scope));
  // Another list state starts afresh, so the old selection can't come back with its state.
  if (selection.scope !== scope) {
    setSelection(emptySelection(scope));
  }
  const live = liveSelection(
    selection,
    scope,
    items.map((item) => item.id),
  );

  return {
    keys: live.keys,
    chosen: items.filter((item) => live.keys.has(item.id)),
    // Selects a row or takes it out; `range` (Shift) runs from the last row toggled.
    toggle: (id: number, ids: number[], range: boolean) => {
      setSelection(range ? selectRange(live, ids, id) : toggle(live, id));
    },
    toggleSection: (ids: number[]) => {
      setSelection(toggleSection(live, ids));
    },
    clear: () => {
      // The bar goes with the selection: the list's heading takes the focus it held.
      if (document.activeElement?.closest('[data-bulk-bar]')) {
        document.querySelector<HTMLElement>(`#${CSS.escape(headingId)}`)?.focus();
      }
      setSelection(emptySelection(scope));
    },
    keep: (ids: number[]) => {
      setSelection({ scope, keys: new Set(ids) });
    },
  };
};

/** The selection of the `BulkList` around, if any. */
export const Bulk = createContext<ReturnType<typeof useSelection> | null>(null);
// A section's rows, in order, and what names it (its heading), for the select-all box.
const Section = createContext<{ ids: number[]; labelledBy?: string }>({ ids: [] });

// Shown on the row's hover or focus, on a device without hover, and while anything is selected.
const BOX =
  'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 group-data-[selecting]/bulk:opacity-100 focus-visible:opacity-100 data-[state=checked]:opacity-100 [@media(hover:none)]:opacity-100';

/**
 * One section's table in a `BulkList`: its rows, in order, for its select-all box and Shift
 * ranges.
 * @param props Component props.
 * @param props.ids The section's rows, in order.
 * @param props.labelledBy The id of what names the section (its heading), if it has one.
 * @param props.children The table.
 * @returns The section's table.
 */
export const BulkSection = (props: {
  ids: number[];
  labelledBy?: string;
  children: React.ReactNode;
}) => (
  <Section value={props}>
    <div className="group/table">{props.children}</div>
  </Section>
);

/**
 * The select-all box at the head of a section's table: tri-state (mixed while some of the section
 * is selected), named after the section's heading.
 * @returns The head cell.
 */
export const SelectAllHead = () => {
  const t = useTranslations('BulkBar');
  const bulk = use(Bulk);
  const section = use(Section);
  const id = useId();

  return (
    <TableHead className="w-9 pr-0">
      {bulk && section.ids.length > 0 && (
        <>
          <span id={id} hidden>
            {t('select_all')}
          </span>
          <Checkbox
            checked={sectionState(bulk.keys, section.ids)}
            aria-labelledby={section.labelledBy ? `${id} ${section.labelledBy}` : id}
            className={cn(BOX, 'group-hover/table:opacity-100')}
            onCheckedChange={() => {
              bulk.toggleSection(section.ids);
            }}
          />
        </>
      )}
    </TableHead>
  );
};

/**
 * A row's box in a `BulkList`: Shift+click selects the range from the last row toggled.
 * @param props Component props.
 * @param props.id The record.
 * @param props.name Its name, for the box's label.
 * @returns The cell.
 */
export const SelectCell = (props: { id: number; name: string }) => {
  const t = useTranslations('BulkBar');
  const bulk = use(Bulk);
  const section = use(Section);

  return (
    <TableCell className="w-9 pr-0">
      {bulk && (
        <Checkbox
          checked={bulk.keys.has(props.id)}
          data-select-id={props.id}
          aria-label={t('select', { name: props.name })}
          className={BOX}
          onClick={(event) => {
            // Toggled here, with the Shift key the box's own change doesn't carry.
            event.preventDefault();
            bulk.toggle(props.id, section.ids, event.shiftKey);
          }}
        />
      )}
    </TableCell>
  );
};

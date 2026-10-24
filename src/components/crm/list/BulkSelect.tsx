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
 * A list's selection, kept to the rows on screen (a row that leaves leaves it) and cleared when the
 * list's state changes.
 * @param scope The list's state (its URL query).
 * @param items The rows on screen.
 * @param headingId The list's heading, which takes the focus when the bar goes with it.
 * @returns The rows selected, and what changes them.
 */
export const useSelection = (scope: string, items: BulkItem[], headingId: string) => {
  const [selection, setSelection] = useState(() => emptySelection(scope));
  const live = liveSelection(
    selection,
    scope,
    items.map((item) => item.id),
  );
  // Another list state starts afresh, and a row that left the list leaves the selection, so
  // neither comes back selected with its state or its row.
  if (
    selection.scope !== scope ||
    live.keys.size < selection.keys.size ||
    live.anchor !== selection.anchor
  ) {
    setSelection(live);
  }

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

// Shown on the row's hover or focus, on a device without hover, while anything is selected, and
// always on a phone, where its target is 36 px tall.
const BOX =
  'opacity-0 group-hover/row:opacity-100 group-focus-within/row:opacity-100 group-data-[selecting]/bulk:opacity-100 focus-visible:opacity-100 data-[state=checked]:opacity-100 max-sm:opacity-100 max-sm:after:-inset-y-2.5 [@media(hover:none)]:opacity-100';

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

// "Go to bulk actions": the keyboard's way to the bar past the rest of the rows. Shown only while
// focused, as a skip link, just above the bar it leads to.
const ToBar = () => {
  const t = useTranslations('BulkBar');

  return (
    <button
      type="button"
      className="sr-only focus:not-sr-only focus:fixed focus:bottom-20 focus:left-1/2 focus:z-40 focus:-translate-x-1/2 focus:rounded-md focus:bg-field focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:whitespace-nowrap focus:text-foreground focus:shadow-float"
      onClick={() => {
        // The toolbar hands the focus on to its current control.
        document.querySelector<HTMLElement>('[data-bulk-bar] [role="toolbar"]')?.focus();
      }}
    >
      {t('go_to_bar')}
    </button>
  );
};

/**
 * A section's select-all box: tri-state (mixed while some of the section is selected), named "Select
 * all" and the section's heading. While rows are selected, the next Tab stop is "Go to bulk
 * actions", which takes the keyboard to the bar past the rest of the rows. From 640 px it heads the
 * section's table (`SelectAllHead`); on a phone, whose tables have no head row, it sits in the
 * section's heading row (`StatusSection`'s `select`), or on a line of its own above an ungrouped
 * list.
 * @param props Component props.
 * @param props.ids The section's rows, in order.
 * @param props.labelledBy The id of what names the section (its heading), if it has one.
 * @param props.className Extra classes.
 * @returns The box, or nothing outside a `BulkList` or for a section without rows.
 */
export const SectionBox = (props: { ids: number[]; labelledBy?: string; className?: string }) => {
  const t = useTranslations('BulkBar');
  const bulk = use(Bulk);
  const id = useId();
  if (!bulk || props.ids.length === 0) {
    return null;
  }

  return (
    <>
      <span id={id} hidden>
        {t('select_all')}
      </span>
      <Checkbox
        checked={sectionState(bulk.keys, props.ids)}
        aria-labelledby={props.labelledBy ? `${id} ${props.labelledBy}` : id}
        className={cn(BOX, props.className)}
        onCheckedChange={() => {
          bulk.toggleSection(props.ids);
        }}
      />
      {bulk.chosen.length > 0 && <ToBar />}
    </>
  );
};

/**
 * The select-all box at the head of a section's table (`SectionBox`).
 * @returns The head cell.
 */
export const SelectAllHead = () => {
  const section = use(Section);

  return (
    <TableHead className="w-9 pr-0">
      <SectionBox
        ids={section.ids}
        labelledBy={section.labelledBy}
        className="group-hover/table:opacity-100"
      />
    </TableHead>
  );
};

/**
 * A row's box in a `BulkList`: Shift+click selects the range from the last row toggled. Ticked,
 * its next Tab stop is "Go to bulk actions", as the select-all box's is.
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
      {bulk?.keys.has(props.id) && <ToBar />}
    </TableCell>
  );
};

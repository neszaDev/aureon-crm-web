'use client';

import { useEffect, useEffectEvent, useId } from 'react';
import type { BulkBarProps } from '@/components/crm/list/BulkBar';
import { BulkBar } from '@/components/crm/list/BulkBar';
import { Bulk, useSelection } from '@/components/crm/list/BulkSelect';
import type { BulkItem } from '@/libs/crm/BulkSelection';

// Where Escape is the field's own.
const TEXT_FIELD = 'input, textarea, select, [contenteditable]';

/**
 * A list whose rows can be selected for a bulk action: the selection, kept to the rows on screen
 * and cleared when the list's group, filters, sort or page change (`scope`), and the bar that acts
 * on it. Escape clears it, outside a text field. With the focus on a row's name, Space selects the row; Shift+Space there
 * or on its box selects the range from the last row toggled.
 * @param props Component props.
 * @param props.scope The list's state (its URL query).
 * @param props.items The rows on screen, every section's.
 * @param props.bar What the bar needs besides the selection.
 * @param props.children The list.
 * @returns The list with its selection.
 */
export const BulkList = (props: {
  scope: string;
  items: BulkItem[];
  bar: Omit<BulkBarProps, 'chosen' | 'onClear' | 'onKeep'>;
  children: React.ReactNode;
}) => {
  const selection = useSelection(props.scope, props.items, props.bar.headingId);
  const id = useId();
  const onKey = useEffectEvent((event: KeyboardEvent) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    // A menu or dialog closing on Escape has already taken it (it prevents the default); a field
    // being typed in keeps it for itself (an inline-add row clears on it).
    if (
      event.key === 'Escape' &&
      !event.defaultPrevented &&
      !target?.matches(TEXT_FIELD) &&
      selection.chosen.length > 0
    ) {
      selection.clear();
      return;
    }
    if (event.key !== ' ' || !target?.closest(`[data-bulk="${CSS.escape(id)}"]`)) {
      return;
    }
    const box = target.closest('tr')?.querySelector<HTMLElement>('[data-select-id]');
    if (box && (target.tagName === 'A' || (target === box && event.shiftKey))) {
      event.preventDefault();
      // The box's own click, Shift and all.
      box.dispatchEvent(new MouseEvent('click', { bubbles: true, shiftKey: event.shiftKey }));
    }
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      onKey(event);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <Bulk value={selection}>
      <div
        data-bulk={id}
        data-selecting={selection.chosen.length > 0 || undefined}
        className="group/bulk"
      >
        {props.children}
        {/* A new list state starts a new bar: the last refusals go with the old one. */}
        <BulkBar
          key={props.scope}
          {...props.bar}
          chosen={selection.chosen}
          onClear={() => {
            selection.clear();
          }}
          onKeep={(ids) => {
            selection.keep(ids);
          }}
        />
      </div>
    </Bulk>
  );
};

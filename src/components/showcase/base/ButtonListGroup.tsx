'use client';

import { useState } from 'react';
import { listItemClass, ListGroup } from './ListGroup';

/**
 * A list group made of buttons: pressing one selects it (shown as the active row).
 * @param props Component props.
 * @param props.label Accessible name of the list.
 * @param props.items Buttons, in order, with an optional `disabled` flag.
 * @returns The list.
 */
export const ButtonListGroup = (props: {
  label: string;
  items: { id: string; label: string; disabled?: boolean }[];
}) => {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <ListGroup label={props.label}>
      {props.items.map((item) => (
        <li key={item.id} className="border-b border-ink-200 last:border-b-0">
          <button
            type="button"
            disabled={item.disabled}
            aria-pressed={selected === item.id}
            onClick={() => {
              setSelected(item.id);
            }}
            className={listItemClass({
              active: selected === item.id,
              disabled: item.disabled,
              interactive: true,
            })}
          >
            {item.label}
          </button>
        </li>
      ))}
    </ListGroup>
  );
};

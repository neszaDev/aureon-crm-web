'use client';

import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';
import { Fragment, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type NavItem = {
  id: string;
  label: string;
  /** Shown instead of the label, which then only names the item for assistive tech. */
  icon?: React.ReactNode;
  disabled?: boolean;
};

// The id the dropdown takes when one of its entries is chosen.
const DROPDOWN = 'dropdown';

type NavVariant = 'plain' | 'tabs' | 'pills';

const LIST: Record<NavVariant, string> = {
  plain: 'gap-1',
  tabs: 'gap-1 border-b border-ink-300',
  pills: 'gap-1',
};

const ITEM: Record<NavVariant, { base: string; active: string }> = {
  plain: {
    base: 'rounded-md text-folder hover:text-folder-deep hover:underline',
    active: 'font-semibold text-ink-950 hover:text-ink-950 hover:no-underline',
  },
  tabs: {
    base: '-mb-px rounded-t-md border border-transparent text-folder hover:border-ink-200 hover:border-b-ink-300 hover:bg-paper-card',
    active:
      'border-ink-300 border-b-paper-card bg-paper-card text-ink-950 hover:border-ink-300 hover:border-b-paper-card',
  },
  pills: {
    base: 'rounded-md text-folder hover:bg-ink-100',
    active: 'bg-folder text-folder-ink hover:bg-folder-deep',
  },
};

/**
 * A row (or column) of navigation items in the Bootstrap nav styles: plain links, tabs or
 * pills, optionally filling or splitting the width evenly, and an optional dropdown at the end.
 * Pressing an item (or choosing a dropdown entry) makes it the current one.
 * @param props Component props.
 * @param props.label Accessible name of the navigation.
 * @param props.items The items, in order.
 * @param props.variant Visual style.
 * @param props.defaultActive Id of the item that starts current (none when omitted).
 * @param props.fill Items grow to fill the row, keeping their own widths.
 * @param props.justified Items share the row in equal widths.
 * @param props.vertical Stacks the items.
 * @param props.dropdown A trailing dropdown: its trigger label and groups of item labels.
 * @param props.dropdown.label Trigger label.
 * @param props.dropdown.groups Item labels, a separator between groups.
 * @returns The navigation.
 */
export const NavDemo = (props: {
  label: string;
  items: NavItem[];
  variant?: NavVariant;
  defaultActive?: string;
  fill?: boolean;
  justified?: boolean;
  vertical?: boolean;
  dropdown?: { label: string; groups: string[][] };
}) => {
  const variant = props.variant ?? 'plain';
  const [active, setActive] = useState(props.defaultActive);
  const styles = ITEM[variant];

  return (
    <nav aria-label={props.label}>
      <ul className={cn('flex flex-wrap', LIST[variant], props.vertical && 'flex-col border-b-0')}>
        {props.items.map((item) => (
          <li
            key={item.id}
            className={cn(props.fill && 'flex-auto', props.justified && 'flex-1 basis-0')}
          >
            <button
              type="button"
              disabled={item.disabled}
              aria-current={active === item.id ? 'page' : undefined}
              aria-label={item.icon ? item.label : undefined}
              onClick={() => {
                setActive(item.id);
              }}
              className={cn(
                'inline-flex h-10 w-full items-center gap-2 px-4 text-[0.9375rem] font-medium whitespace-nowrap transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
                (props.fill === true || props.justified === true) && 'justify-center',
                props.vertical && 'justify-start',
                styles.base,
                active === item.id && styles.active,
                'disabled:cursor-not-allowed disabled:border-transparent disabled:bg-transparent disabled:text-ink-400 disabled:no-underline',
              )}
            >
              {item.icon ?? item.label}
            </button>
          </li>
        ))}
        {props.dropdown && (
          <li>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'inline-flex h-10 items-center gap-1.5 px-4 text-[0.9375rem] font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-expanded:bg-ink-100',
                  styles.base,
                  active === DROPDOWN && styles.active,
                )}
              >
                {props.dropdown.label}
                <ChevronDownIcon aria-hidden="true" className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-auto min-w-40">
                {props.dropdown.groups.map((group, index) => (
                  <Fragment key={group.join(',')}>
                    {index > 0 && <DropdownMenuSeparator />}
                    {group.map((entry) => (
                      <DropdownMenuItem
                        key={entry}
                        onSelect={() => {
                          setActive(DROPDOWN);
                        }}
                      >
                        {entry}
                      </DropdownMenuItem>
                    ))}
                  </Fragment>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        )}
      </ul>
    </nav>
  );
};

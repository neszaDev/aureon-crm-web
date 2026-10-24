import { cn } from 'cn';
import { ChevronDownIcon, LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { StatusTone } from '@/libs/crm/StatusColors';
import { PILL } from '@/libs/crm/StatusColors';

// The keys that open a menu button's menu.
const OPENING_KEYS = new Set(['Enter', ' ', 'ArrowDown', 'ArrowUp']);

// Stop the trigger opening its menu (its own handlers skip a prevented event); the button keeps
// the focus, which a `disabled` one would drop, and Tab still leaves it.
const stayShut = (event: React.PointerEvent) => {
  event.preventDefault();
};
const stayShutFromKeys = (event: React.KeyboardEvent) => {
  if (OPENING_KEYS.has(event.key)) {
    event.preventDefault();
  }
};

/**
 * A status as one coloured pill: a lead's status, a deal's stage, a task's state. With a menu it
 * is also the control that changes it. While a change is on its way (`pending`) it spins in place
 * of its dot and is busy; `pending` or `disabled`, it keeps the focus but opens nothing.
 * @param props Component props.
 * @param props.tone Its colour (`StatusColors`).
 * @param props.label The status, written in the pill.
 * @param props.field What it is the value of, for assistive technology ("Status" by default):
 *   the pill reads "Status: Qualified".
 * @param props.menu The menu's items; with them the pill is a button that opens it.
 * @param props.pending Whether a change is on its way: the server hasn't answered yet.
 * @param props.disabled Whether the menu is off (the caller may not change it).
 * @param props.className Extra classes.
 * @returns The pill.
 */
export const StatusPill = (props: {
  tone: StatusTone;
  label: string;
  field?: string;
  menu?: React.ReactNode;
  pending?: boolean;
  disabled?: boolean;
  className?: string;
}) => {
  const t = useTranslations('StatusPill');
  const name = t('name', { field: props.field ?? t('status'), label: props.label });
  const dot = <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-(--tone)" />;
  // The words assistive technology reads are `name`, so the drawn ones are hidden from it.
  const label = (
    <span aria-hidden="true" title={props.label} className="truncate">
      {props.label}
    </span>
  );

  if (!props.menu) {
    return (
      <span data-slot="status-pill" data-tone={props.tone} className={cn(PILL, props.className)}>
        <span className="sr-only">{name}</span>
        {dot}
        {label}
      </span>
    );
  }

  const off = props.pending === true || props.disabled === true;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-slot="status-pill"
          data-tone={props.tone}
          aria-label={name}
          aria-busy={props.pending ? true : undefined}
          aria-disabled={off || undefined}
          onPointerDown={off ? stayShut : undefined}
          onKeyDown={off ? stayShutFromKeys : undefined}
          className={cn(
            PILL,
            'pr-1.5 transition-colors duration-150 aria-expanded:border-(--tone)',
            off ? 'cursor-default' : 'hover:border-(--tone)',
            props.disabled && 'opacity-60',
            props.className,
          )}
        >
          {props.pending ? (
            <LoaderCircleIcon aria-hidden="true" className="size-3 shrink-0 animate-spin" />
          ) : (
            dot
          )}
          {label}
          <ChevronDownIcon aria-hidden="true" className="size-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto">{props.menu}</DropdownMenuContent>
    </DropdownMenu>
  );
};

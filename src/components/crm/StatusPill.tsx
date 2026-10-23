import { cn } from 'cn';
import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { StatusTone } from '@/libs/crm/StatusColors';

const PILL =
  'inline-flex h-6 max-w-full min-w-0 items-center gap-1.5 rounded-full border border-transparent bg-(--tone-tint) px-2.5 text-xs font-semibold whitespace-nowrap text-(--tone-ink)';

/**
 * A status as one coloured pill: a lead's status, a deal's stage, a task's state. With a menu it
 * is also the control that changes it.
 * @param props Component props.
 * @param props.tone Its colour (`StatusColors`).
 * @param props.label The status, written in the pill.
 * @param props.field What it is the value of, for assistive technology ("Status" by default):
 *   the pill reads "Status: Qualified".
 * @param props.menu The menu's items; with them the pill is a button that opens it.
 * @param props.className Extra classes.
 * @returns The pill.
 */
export const StatusPill = (props: {
  tone: StatusTone;
  label: string;
  field?: string;
  menu?: React.ReactNode;
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
      <span data-tone={props.tone} className={cn(PILL, props.className)}>
        <span className="sr-only">{name}</span>
        {dot}
        {label}
      </span>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          data-tone={props.tone}
          aria-label={name}
          className={cn(
            PILL,
            'pr-1.5 transition-colors duration-150 hover:border-(--tone) aria-expanded:border-(--tone)',
            props.className,
          )}
        >
          {dot}
          {label}
          <ChevronDownIcon aria-hidden="true" className="size-3.5 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-auto">{props.menu}</DropdownMenuContent>
    </DropdownMenu>
  );
};

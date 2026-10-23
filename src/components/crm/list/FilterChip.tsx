'use client';

import { cn } from 'cn';
import { ChevronDownIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import type { FilterOption } from '@/components/crm/list/FilterSelect';
import { PersonAvatar } from '@/components/crm/PersonAvatar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import { useRouter } from '@/libs/I18nNavigation';

// From this many options the list gets a search field.
const SEARCH_FROM = 8;
// The "Any" item's value: no filter value is this.
const ANY = '*';

/**
 * The look of a toolbar control: 32 px high (36 px on phones), on a hairline, and filled with the
 * violet tint while it is on.
 * @param on Whether it is on (a filter set, a grouping chosen, "Me" pressed).
 * @returns The classes.
 */
export const toolClass = (on: boolean) =>
  cn(
    'inline-flex h-9 max-w-full min-w-0 items-stretch rounded-md border text-[0.8125rem] font-medium transition-colors duration-150 sm:h-8',
    on
      ? 'border-transparent bg-violet-tint text-violet-ink'
      : 'border-border bg-field text-foreground',
  );

/** A clickable part of a toolbar control: the whole of a menu button, or a chip's halves. */
export const TOOL_PART =
  'flex min-w-0 items-center gap-1.5 rounded-md px-2 outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-ring dark:hover:bg-white/8';

/**
 * A list filter as a toolbar chip that opens its control in a popover. Once on, the chip shows
 * the value (cut short, whole in its tooltip) and an × that clears it, handing the focus to the
 * chip (the × leaves with the value).
 * @param props Component props.
 * @param props.label The filter, such as "Owner".
 * @param props.value Its value, when it is on.
 * @param props.clearHref The list without it.
 * @param props.open Whether the popover is open, when the caller controls it.
 * @param props.onOpenChange Called when it opens or closes.
 * @param props.children The control.
 * @returns The chip.
 */
export const FilterChip = (props: {
  label: string;
  value?: string;
  clearHref: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  const t = useTranslations('ListToolbar');
  const router = useRouter();
  const trigger = useRef<HTMLButtonElement>(null);
  const on = props.value !== undefined;

  return (
    <div className={toolClass(on)}>
      <Popover open={props.open} onOpenChange={props.onOpenChange}>
        <PopoverTrigger asChild>
          <button ref={trigger} type="button" className={cn(TOOL_PART, on && 'pr-1.5')}>
            <span className="shrink-0">
              {on ? t('chip_on', { label: props.label }) : props.label}
            </span>
            {on && (
              <>
                {' '}
                <span title={props.value} className="max-w-40 truncate font-semibold">
                  {props.value}
                </span>
              </>
            )}
            {!on && <ChevronDownIcon aria-hidden="true" className="size-3.5 shrink-0 opacity-70" />}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 max-w-[calc(100vw-2rem)]">
          {props.children}
        </PopoverContent>
      </Popover>
      {on && (
        <button
          type="button"
          aria-label={t('clear', { label: props.label })}
          className={cn(TOOL_PART, 'px-1.5')}
          onClick={() => {
            router.push(props.clearHref, { scroll: false });
            trigger.current?.focus();
          }}
        >
          <XIcon aria-hidden="true" className="size-3.5" />
        </button>
      )}
    </div>
  );
};

/**
 * A filter that takes one of a list of values, as a chip: its popover lists "Any" and the values
 * (searchable from eight), a person with their avatar. Choosing keeps the other params and goes
 * back to the first page. A valid value the options don't hold (an owner who left the
 * workspace) shows as `missingLabel`.
 * @param props Component props.
 * @param props.label The filter.
 * @param props.anyLabel The option without a filter.
 * @param props.missingLabel What a value the options don't hold reads.
 * @param props.param The URL param it sets.
 * @param props.options The values, in order.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @returns The chip.
 */
export const OptionsChip = (props: {
  label: string;
  anyLabel: string;
  missingLabel: string;
  param: string;
  options: FilterOption[];
  path: string;
  query: ListQuery;
}) => {
  const t = useTranslations('ListToolbar');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const current = props.query.params[props.param];
  const value = typeof current === 'string' ? current : undefined;
  const choose = (next?: string) => {
    setOpen(false);
    router.push(listHref(props.path, props.query, { [props.param]: next }), { scroll: false });
  };
  const item = (option: FilterOption) => (
    <CommandItem
      key={option.value}
      value={option.value}
      keywords={[option.label]}
      data-checked={option.value === (value ?? ANY)}
      onSelect={() => {
        choose(option.value === ANY ? undefined : option.value);
      }}
    >
      {option.person && <PersonAvatar person={option.person} size="xs" />}
      <span className="min-w-0 break-words">
        {option.label}
        {option.value === (value ?? ANY) && <span className="sr-only"> {t('current')}</span>}
      </span>
    </CommandItem>
  );

  return (
    <FilterChip
      label={props.label}
      value={
        value === undefined
          ? undefined
          : (props.options.find((option) => option.value === value)?.label ?? props.missingLabel)
      }
      clearHref={listHref(props.path, props.query, { [props.param]: undefined })}
      open={open}
      onOpenChange={setOpen}
    >
      <Command label={props.label} className="-m-2 w-auto">
        {props.options.length >= SEARCH_FROM && (
          <CommandInput placeholder={t('chip_search', { label: props.label })} />
        )}
        <CommandList>
          <CommandEmpty>{t('chip_empty')}</CommandEmpty>
          <CommandGroup>
            {[{ value: ANY, label: props.anyLabel }, ...props.options].map(item)}
          </CommandGroup>
        </CommandList>
      </Command>
    </FilterChip>
  );
};

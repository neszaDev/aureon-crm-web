'use client';

import { cn } from 'cn';
import { ChevronsUpDownIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/** One option of a combobox. */
export type ComboboxOption = { value: string; label: string; disabled?: boolean };

/**
 * Toggles an option in a selection: adds it at the end, or removes it when already selected.
 * A single selection holds at most one value, and choosing it again keeps it.
 * @param selection Current selected values.
 * @param value The option chosen.
 * @param multiple Whether several values may be selected.
 * @returns The new selection.
 */
export const toggleSelection = (selection: string[], value: string, multiple: boolean) => {
  if (!multiple) {
    return [value];
  }
  return selection.includes(value)
    ? selection.filter((selected) => selected !== value)
    : [...selection, value];
};

/**
 * A select with a search box, built from a popover and a command list. With `multiple`, the
 * chosen options sit in the field as chips that can be removed one by one (or with Backspace
 * in the search box); disabled options stay visible but cannot be picked.
 * @param props Component props.
 * @param props.options The options, in display order.
 * @param props.value Selected option values.
 * @param props.onValueChange Called with the new selection.
 * @param props.multiple Allow several options.
 * @param props.clearable Show a button that clears the selection.
 * @param props.placeholder Text shown while nothing is selected.
 * @param props.searchPlaceholder Placeholder of the search box.
 * @param props.labelId Id of the visible label, for `aria-labelledby`.
 * @param props.id Id of the trigger button.
 * @param props.disabled Lock the field.
 * @param props.className Extra classes for the field.
 * @returns The combobox.
 */
export const Combobox = (props: {
  options: ComboboxOption[];
  value: string[];
  onValueChange: (value: string[]) => void;
  multiple?: boolean;
  clearable?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  labelId?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}) => {
  const t = useTranslations('Combobox');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const multiple = props.multiple ?? false;
  const selected = props.value
    .map((value) => props.options.find((option) => option.value === value))
    .filter((option) => option !== undefined);
  const placeholder = props.placeholder ?? t('placeholder');

  const choose = (value: string) => {
    props.onValueChange(toggleSelection(props.value, value, multiple));
    setSearch('');
    if (!multiple) {
      setOpen(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setSearch('');
      }}
    >
      <PopoverAnchor asChild>
        <div
          className={cn(
            'flex min-h-10 w-full items-center gap-1.5 rounded-md border border-input bg-ply py-1 pr-1 pl-2 shadow-ply transition-[border-color,box-shadow] hover:border-ink-400 has-[[aria-expanded=true]]:border-folder has-[[aria-expanded=true]]:ring-3 has-[[aria-expanded=true]]:ring-folder/20 has-disabled:pointer-events-none has-disabled:opacity-50',
            props.className,
          )}
        >
          {multiple && selected.length > 0 && (
            <ul className="flex flex-wrap gap-1" aria-label={t('selected')}>
              {selected.map((option) => (
                <li
                  key={option.value}
                  className="flex h-7 items-center gap-0.5 rounded-sm border border-ink-300 bg-paper-card pr-0.5 pl-2 text-sm text-ink-900"
                >
                  {option.label}
                  <button
                    disabled={props.disabled}
                    type="button"
                    className="flex size-6 items-center justify-center rounded-sm text-ink-600 outline-none hover:bg-ink-100 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={t('remove', { label: option.label })}
                    onClick={() => {
                      choose(option.value);
                    }}
                  >
                    <XIcon aria-hidden="true" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <PopoverTrigger asChild>
            <button
              id={props.id}
              type="button"
              disabled={props.disabled}
              aria-labelledby={
                props.labelId && props.id ? `${props.labelId} ${props.id}` : props.labelId
              }
              className="flex h-8 min-w-24 flex-1 items-center justify-between gap-2 rounded-sm px-1 text-left text-[0.9375rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span
                className={cn('truncate', selected.length === 0 ? 'text-ink-400' : 'text-ink-900')}
              >
                {multiple || selected.length === 0 ? placeholder : selected[0]?.label}
              </span>
              <ChevronsUpDownIcon aria-hidden="true" className="size-4 shrink-0 text-ink-600" />
            </button>
          </PopoverTrigger>
          {props.clearable && selected.length > 0 && (
            <button
              type="button"
              disabled={props.disabled}
              className="flex size-8 shrink-0 items-center justify-center rounded-sm text-ink-600 outline-none hover:bg-ink-100 hover:text-ink-900 focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t('clear')}
              onClick={() => {
                props.onValueChange([]);
              }}
            >
              <XIcon aria-hidden="true" className="size-4" />
            </button>
          )}
        </div>
      </PopoverAnchor>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-60 p-0">
        <Command>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={props.searchPlaceholder ?? t('search')}
            onKeyDown={(event) => {
              const last = props.value.at(-1);
              if (event.key === 'Backspace' && search === '' && multiple && last) {
                choose(last);
              }
            }}
          />
          <CommandList>
            <CommandEmpty>{t('empty')}</CommandEmpty>
            <CommandGroup>
              {props.options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  keywords={[option.value]}
                  disabled={option.disabled}
                  data-checked={props.value.includes(option.value)}
                  // Keep the focus in the search box, so typing goes on filtering after a pick.
                  onMouseDown={(event) => {
                    event.preventDefault();
                  }}
                  onSelect={() => {
                    choose(option.value);
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

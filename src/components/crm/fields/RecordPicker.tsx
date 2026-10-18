'use client';

import { ChevronsUpDownIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import type { RecordKind, RecordOption } from '@/actions/crm/RecordSearchActions';
import { searchRecords } from '@/actions/crm/RecordSearchActions';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const TYPING_PAUSE_MS = 250;

/** A linked record as a picker shows it: its id and name. */
export type PickedRecord = { id: number; label: string };

/**
 * Links a record: the way every form and filter picks a company, contact, lead or deal. The
 * field shows the current record's name as given (no search); opening it lists the first active
 * records of the kind, and typing searches them on the server (`searchRecords`). Clearable. Its
 * label is a `<label htmlFor={id}>` outside it.
 * @param props Component props.
 * @param props.id The field's id.
 * @param props.workspaceId The workspace searched.
 * @param props.kind The kind of record.
 * @param props.value The linked record, or null.
 * @param props.onChange Called with the picked record, or null when cleared.
 * @param props.placeholder What the field says without a record (default "None").
 * @param props.invalid Whether the field has an error.
 * @param props.describedBy The id of its hint or error.
 * @returns The field.
 */
export const RecordPicker = (props: {
  id: string;
  workspaceId: number;
  kind: RecordKind;
  value: PickedRecord | null;
  onChange: (value: PickedRecord | null) => void;
  placeholder?: string;
  invalid?: boolean;
  describedBy?: string;
}) => {
  const t = useTranslations('RecordPicker');
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [results, setResults] = useState<RecordOption[]>([]);
  const [searching, setSearching] = useState(false);
  // The search whose answer the list may show: an earlier one answering late is dropped.
  const latest = useRef('');
  const timer = useRef(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = `${props.id}-list`;

  const search = async (q: string) => {
    latest.current = q;
    setSearching(true);
    const found = await searchRecords(props.workspaceId, props.kind, q).catch(() => []);
    if (latest.current === q) {
      setResults(found);
      setSearching(false);
    }
  };

  return (
    <div className="relative w-full">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          window.clearTimeout(timer.current);
          if (next) {
            setText('');
            setResults([]);
            void search('');
          }
        }}
      >
        <PopoverTrigger asChild>
          <button
            ref={trigger}
            id={props.id}
            type="button"
            // The select-only combobox pattern, as Radix Select's trigger: a button that opens a
            // list. Radix sets the same expanded state and controlled id at run time.
            // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- see above
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-invalid={props.invalid ? true : undefined}
            aria-describedby={props.describedBy}
            className="flex h-10 w-full min-w-0 items-center justify-between gap-1.5 rounded-md border border-input bg-field py-2 pr-2.5 pl-3 text-left text-base text-foreground shadow-ply transition-[border-color,box-shadow] outline-none hover:border-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 data-[clearable=true]:pr-16 sm:text-[0.9375rem]"
            data-clearable={props.value !== null}
          >
            <span className={props.value ? 'truncate' : 'truncate text-muted-foreground'}>
              {props.value?.label ?? props.placeholder ?? t('none')}
            </span>
            <ChevronsUpDownIcon
              aria-hidden="true"
              className="absolute right-2.5 size-4 shrink-0 text-muted-foreground"
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          id={listId}
          align="start"
          className="w-(--radix-popover-trigger-width) min-w-64 p-0"
        >
          <Command shouldFilter={false} label={t(`search_${props.kind}`)}>
            <CommandInput
              value={text}
              placeholder={t(`search_${props.kind}`)}
              onValueChange={(next) => {
                setText(next);
                window.clearTimeout(timer.current);
                timer.current = window.setTimeout(() => {
                  void search(next.trim());
                }, TYPING_PAUSE_MS);
              }}
            />
            <CommandList>
              {searching && results.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{t('searching')}</p>
              ) : (
                <CommandEmpty>{t('empty')}</CommandEmpty>
              )}
              <CommandGroup>
                {results.map((option) => (
                  <CommandItem
                    key={option.id}
                    value={String(option.id)}
                    data-checked={option.id === props.value?.id}
                    onSelect={() => {
                      props.onChange({ id: option.id, label: option.label });
                      setOpen(false);
                    }}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="break-words">{option.label}</span>
                      {option.detail && (
                        <span className="text-xs break-all text-muted-foreground">
                          {option.detail}
                        </span>
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {props.value && (
        <button
          type="button"
          aria-label={t(`clear_${props.kind}`)}
          className="absolute top-1/2 right-8 flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onClick={() => {
            props.onChange(null);
            // This button goes with the record: the focus stays in the field.
            trigger.current?.focus();
          }}
        >
          <XIcon aria-hidden="true" className="size-4" />
        </button>
      )}
    </div>
  );
};

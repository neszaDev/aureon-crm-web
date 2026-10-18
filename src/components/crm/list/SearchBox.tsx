'use client';

import { SearchIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ListQuery } from '@/libs/crm/ListQuery';
import { listHref } from '@/libs/crm/ListQuery';
import { useRouter } from '@/libs/I18nNavigation';

const TYPING_PAUSE_MS = 300;

/**
 * A text filter of a list (`q`, or another text param): it updates the URL once typing pauses
 * for 300 ms, keeping the other params and going back to the first page.
 * @param props Component props.
 * @param props.id The input's id.
 * @param props.label Its visible label.
 * @param props.placeholder What it searches, such as "Name, website or phone".
 * @param props.param The URL param it sets.
 * @param props.path The list's path.
 * @param props.query The current list query.
 * @returns The labelled search field.
 */
export const SearchBox = (props: {
  id: string;
  label: string;
  placeholder?: string;
  param: string;
  path: string;
  query: ListQuery;
}) => {
  const router = useRouter();
  const current = props.query.params[props.param];
  const value = typeof current === 'string' ? current : '';
  const [text, setText] = useState(value);
  // The URL value this box last followed, and the one it last asked for.
  const [shown, setShown] = useState(value);
  const [requested, setRequested] = useState(value);
  const timer = useRef(0);

  // The URL changed: unless this box asked for it, show the new value (Back, "Clear filters").
  if (value !== shown) {
    setShown(value);
    if (value !== requested) {
      setText(value);
      setRequested(value);
    }
  }

  return (
    <div className="flex min-w-48 flex-1 basis-56 flex-col gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={props.id}
          type="search"
          autoComplete="off"
          placeholder={props.placeholder}
          value={text}
          className="pl-9"
          onChange={(event) => {
            const input = event.currentTarget;
            setText(input.value);
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => {
              const next = input.value.trim();
              // Gone (the user followed a link meanwhile), or nothing new to ask for.
              if (!input.isConnected || next === value) {
                return;
              }
              setRequested(next);
              router.replace(
                listHref(props.path, props.query, { [props.param]: next || undefined }),
                { scroll: false },
              );
            }, TYPING_PAUSE_MS);
          }}
        />
      </div>
    </div>
  );
};

'use client';

import { cn } from 'cn';
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
 * @param props.className Extra classes, such as `basis-full` for a row of its own.
 * @param props.hideLabel Whether the label is for assistive technology only (a toolbar's search,
 *   whose placeholder says what it searches).
 * @returns The labelled search field.
 */
export const SearchBox = (props: {
  id: string;
  label: string;
  placeholder?: string;
  param: string;
  path: string;
  query: ListQuery;
  className?: string;
  hideLabel?: boolean;
}) => {
  const router = useRouter();
  const current = props.query.params[props.param];
  const value = typeof current === 'string' ? current : '';
  const [text, setText] = useState(value);
  // The URL value this box last followed, and the values it asked for that haven't shown yet.
  const [shown, setShown] = useState(value);
  const [pending, setPending] = useState<string[]>([]);
  const timer = useRef(0);

  // The URL changed. One of this box's requests landing leaves the text alone, as the user may
  // have typed on (even back to an earlier value); any other change (Back, "Clear filters")
  // replaces it.
  if (value !== shown) {
    setShown(value);
    const landed = pending.indexOf(value);
    if (landed === -1) {
      setText(value);
      setPending([]);
    } else {
      setPending(pending.slice(landed + 1));
    }
  }

  return (
    <div className={cn('flex min-w-48 flex-1 basis-56 flex-col gap-2', props.className)}>
      <Label htmlFor={props.id} className={props.hideLabel ? 'sr-only' : undefined}>
        {props.label}
      </Label>
      <div className="relative">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id={props.id}
          type="search"
          autoComplete="off"
          // The backend refuses a longer search, which the page would call invalid filters.
          maxLength={200}
          placeholder={props.placeholder}
          value={text}
          className="pl-9 text-ellipsis"
          onChange={(event) => {
            const input = event.currentTarget;
            setText(input.value);
            // The value the URL holds once every request has landed: the last one still on its
            // way, or the URL's own. Asking for it again would refetch the same list. Read at the
            // keystroke: this box's requests landing during the pause leave it as is, and a change
            // it didn't ask for (Back) puts the URL's value in the box, at worst asked for again.
            const lastAsked = pending.at(-1) ?? shown;
            window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => {
              // Gone: the user followed a link meanwhile.
              if (!input.isConnected) {
                return;
              }
              const next = input.value.trim();
              if (next === lastAsked) {
                return;
              }
              setPending((asked) => [...asked, next]);
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

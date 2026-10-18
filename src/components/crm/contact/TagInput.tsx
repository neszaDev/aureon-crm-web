'use client';

import { PlusIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

// As the backend: at most 20 tags a contact.
const MAX_TAGS = 20;
const MAX_SUGGESTIONS = 8;

/**
 * A contact's tags as chips, for a form that controls them (react-hook-form `Controller`). Enter
 * or a comma adds the typed tag, trimmed and in lower case, unless it is already there; Backspace
 * in the empty input removes the last one. While typing, the workspace's tags that hold the text
 * are offered as buttons. At 20 tags the input takes no more and says why (it stays focusable,
 * so Backspace still works). Its label is a `<label htmlFor={id}>` outside it.
 * @param props Component props.
 * @param props.id The input's id.
 * @param props.value The tags.
 * @param props.onChange Called with the new tags.
 * @param props.suggestions The workspace's tags (`getContactTags`).
 * @param props.invalid Whether the field has an error.
 * @param props.errorId The id of its error, when it has one.
 * @returns The field.
 */
export const TagInput = (props: {
  id: string;
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  invalid?: boolean;
  errorId?: string;
}) => {
  const t = useTranslations('TagInput');
  const [text, setText] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const full = props.value.length >= MAX_TAGS;
  const hintId = `${props.id}-hint`;
  const typed = text.trim().toLowerCase();
  const matches = typed
    ? props.suggestions
        .filter((tag) => tag.includes(typed) && !props.value.includes(tag))
        .slice(0, MAX_SUGGESTIONS)
    : [];

  const add = (raw: string[]) => {
    const next = [...props.value];
    for (const item of raw) {
      const tag = item.trim().toLowerCase();
      if (tag && !next.includes(tag) && next.length < MAX_TAGS) {
        next.push(tag);
      }
    }
    if (next.length > props.value.length) {
      props.onChange(next);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-field px-2 py-1.5 shadow-ply transition-[border-color,box-shadow] hover:border-muted-foreground has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/20 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/15">
        {props.value.length > 0 && (
          <ul className="flex max-w-full flex-wrap gap-1.5">
            {props.value.map((tag) => (
              <li
                key={tag}
                className="flex min-h-7 max-w-full items-center gap-0.5 rounded-sm border border-rule bg-muted pr-0.5 pl-2 text-sm"
              >
                <span className="min-w-0 break-all">{tag}</span>
                <button
                  type="button"
                  aria-label={t('remove', { tag })}
                  className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-field hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    props.onChange(props.value.filter((item) => item !== tag));
                    // The button goes with its tag: the focus stays in the field.
                    input.current?.focus();
                  }}
                >
                  <XIcon aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={input}
          id={props.id}
          value={text}
          autoComplete="off"
          enterKeyHint="enter"
          // Not `disabled`: that would drop the focus to the page as the 20th tag goes in.
          readOnly={full}
          aria-disabled={full ? true : undefined}
          aria-invalid={props.invalid ? true : undefined}
          aria-describedby={props.errorId ? `${hintId} ${props.errorId}` : hintId}
          className="h-7 min-w-28 flex-1 bg-transparent px-1 text-base text-foreground outline-none placeholder:text-muted-foreground aria-disabled:cursor-not-allowed sm:text-[0.9375rem]"
          onChange={(event) => {
            // A comma ends a tag, typed or pasted: what follows the last one is still being typed.
            const parts = event.currentTarget.value.split(',');
            const rest = parts.pop() ?? '';
            add(parts);
            setText(rest);
          }}
          onKeyDown={(event) => {
            // Enter that ends an IME composition (Japanese, Chinese) only confirms the text.
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              // Never submits the form.
              event.preventDefault();
              add([text]);
              setText('');
            } else if (event.key === 'Backspace' && text === '' && props.value.length > 0) {
              props.onChange(props.value.slice(0, -1));
            }
          }}
        />
      </div>
      {matches.length > 0 && (
        <ul aria-label={t('suggestions')} className="flex flex-wrap gap-1.5">
          {matches.map((tag) => (
            <li key={tag}>
              <button
                type="button"
                aria-label={t('add', { tag })}
                className="flex h-7 items-center gap-1 rounded-sm border border-input bg-field px-2 text-sm text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  add([tag]);
                  setText('');
                  input.current?.focus();
                }}
              >
                <PlusIcon aria-hidden="true" className="size-3.5 text-muted-foreground" />
                {tag}
              </button>
            </li>
          ))}
        </ul>
      )}
      <p id={hintId} className="text-[0.8125rem] text-muted-foreground">
        {full ? t('limit', { max: MAX_TAGS }) : t('hint')}
      </p>
    </div>
  );
};

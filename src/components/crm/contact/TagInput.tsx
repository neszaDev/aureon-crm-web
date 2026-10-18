'use client';

import { cn } from 'cn';
import { PlusIcon, XIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { fieldSurface } from '@/components/ui/field-surface';

// As the backend: at most 20 tags a contact, each at most 40 characters.
const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 40;
const MAX_SUGGESTIONS = 8;

// Keeps the focus in the input when a chip's or a suggestion's button is clicked (Safari doesn't
// focus a clicked button), so leaving the field, not the click, adds what was typed.
const keepFocus = (event: React.MouseEvent) => {
  event.preventDefault();
};

/**
 * A contact's tags as chips, for a form that controls them (react-hook-form `Controller`). Enter,
 * a comma or leaving the field adds the typed tag, trimmed and in lower case, unless it is
 * already there; Backspace in the empty input removes the last one. While typing, the
 * workspace's tags that hold the text are offered as buttons; leaving the field keeps their room
 * (hidden) until it is focused again, so a click just under it still lands. A tag over 40
 * characters is flagged on its chip. At 20 tags the input takes no more and says why (it stays focusable, so
 * Backspace still works); a pasted list past 20 is cut there. What it adds, removes or drops is
 * read out. Its label is a `<label htmlFor={id}>` outside it.
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
  // Each message is a new node (`n` keys it), so the same words said twice are read twice.
  const [announcement, setAnnouncement] = useState({ text: '', n: 0 });
  // The suggestions shown as the focus left the field: their room stays (hidden) until it comes
  // back, so what was under the pointer (Save) doesn't move between the press and the release.
  const [kept, setKept] = useState<string[]>([]);
  const input = useRef<HTMLInputElement>(null);
  const full = props.value.length >= MAX_TAGS;
  const hintId = `${props.id}-hint`;
  const typed = text.trim().toLowerCase();
  const matches = typed
    ? props.suggestions
        .filter((tag) => tag.includes(typed) && !props.value.includes(tag))
        .slice(0, MAX_SUGGESTIONS)
    : [];
  const say = (message: string) => {
    setAnnouncement((current) => ({ text: message, n: current.n + 1 }));
  };

  /**
   * Adds tags, and keeps `rest` (still being typed) in the input while there is room for it.
   * @param raw The tags, as typed.
   * @param rest What follows the last comma.
   */
  const add = (raw: string[], rest = '') => {
    const next = [...props.value];
    const added: string[] = [];
    const dropped: string[] = [];
    const isNew = (tag: string) => tag !== '' && !next.includes(tag) && !dropped.includes(tag);
    for (const tag of raw.map((item) => item.trim().toLowerCase())) {
      if (isNew(tag) && next.length < MAX_TAGS) {
        next.push(tag);
        added.push(tag);
      } else if (isNew(tag)) {
        dropped.push(tag);
      }
    }
    // No room left for what is still being typed: dropped too, not stuck in a read-only input.
    const room = next.length < MAX_TAGS;
    const last = rest.trim().toLowerCase();
    if (!room && isNew(last)) {
      dropped.push(last);
    }
    if (added.length > 0) {
      props.onChange(next);
    }
    setText(room ? rest : '');
    const said = [
      added.length > 0 ? t('added', { tags: added.join(', ') }) : '',
      dropped.length > 0 ? t('dropped', { tags: dropped.join(', '), max: MAX_TAGS }) : '',
    ]
      .filter(Boolean)
      .join(' ');
    if (said) {
      say(said);
    }
  };
  const remove = (tags: string[]) => {
    const [tag] = tags;
    if (tag !== undefined) {
      props.onChange(props.value.filter((item) => item !== tag));
      say(t('removed', { tag }));
    }
  };

  return (
    <div
      className="flex flex-col gap-2"
      onBlur={(event) => {
        // Leaving the field, not moving within it (a chip, a suggestion), adds what was typed.
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setKept(matches);
          add([text]);
        }
      }}
      onFocus={() => {
        setKept([]);
      }}
    >
      <div
        className={cn(
          fieldSurface,
          'flex min-h-10 w-full flex-wrap items-center gap-1.5 px-2 py-1.5 has-focus-visible:border-ring has-focus-visible:ring-3 has-focus-visible:ring-ring/20 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/15',
        )}
      >
        {props.value.length > 0 && (
          // An explicit role: Safari drops the list semantics of a list without bullets.
          // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- see above
          <ul role="list" aria-label={t('chosen')} className="flex max-w-full flex-wrap gap-1.5">
            {props.value.map((tag) => {
              const tooLong = tag.length > MAX_TAG_LENGTH;

              return (
                <li
                  key={tag}
                  className={cn(
                    'flex min-h-7 max-w-full items-center gap-0.5 rounded-sm border border-rule bg-muted pr-0.5 pl-2 text-sm',
                    tooLong && 'border-destructive text-danger',
                  )}
                >
                  <span className="min-w-0 break-all">
                    {tag}
                    {tooLong && <span className="sr-only"> {t('too_long')}</span>}
                  </span>
                  <button
                    type="button"
                    aria-label={t('remove', { tag })}
                    className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground outline-none hover:bg-field hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    onMouseDown={keepFocus}
                    onClick={() => {
                      remove([tag]);
                      // The button goes with its tag: the focus stays in the field.
                      input.current?.focus();
                    }}
                  >
                    <XIcon aria-hidden="true" className="size-3.5" />
                  </button>
                </li>
              );
            })}
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
          className="h-7 min-w-28 flex-1 bg-transparent px-1 outline-none placeholder:text-muted-foreground aria-disabled:cursor-not-allowed"
          onChange={(event) => {
            // A comma ends a tag, typed or pasted: what follows the last one is still being typed.
            const parts = event.currentTarget.value.split(',');
            const rest = parts.pop() ?? '';
            add(parts, rest);
          }}
          onKeyDown={(event) => {
            // Enter that ends an IME composition (Japanese, Chinese) only confirms the text.
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
              // Never submits the form.
              event.preventDefault();
              add([text]);
            } else if (event.key === 'Backspace' && text === '') {
              remove(props.value.slice(-1));
            }
          }}
        />
      </div>
      {(matches.length > 0 || kept.length > 0) && (
        <ul
          // oxlint-disable-next-line jsx-a11y/no-redundant-roles -- as the chips' list
          role="list"
          aria-label={t('suggestions')}
          className={cn('flex flex-wrap gap-1.5', matches.length === 0 && 'invisible')}
        >
          {(matches.length > 0 ? matches : kept).map((tag) => (
            <li key={tag}>
              <button
                type="button"
                aria-label={t('add', { tag })}
                className="flex h-7 items-center gap-1 rounded-sm border border-input bg-field px-2 text-sm text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                onMouseDown={keepFocus}
                onClick={() => {
                  add([tag]);
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
      <output className="sr-only">
        <span key={announcement.n}>{announcement.text}</span>
      </output>
    </div>
  );
};

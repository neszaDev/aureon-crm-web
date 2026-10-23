'use client';

import { LoaderCircleIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';
import { toast } from 'sonner';
import type { ActionResult } from '@/libs/api/ApiError';
import { Link } from '@/libs/I18nNavigation';
import { useSettle } from '@/utils/SettleAction';

const ROW =
  'flex h-9 w-full items-center gap-2 px-3 text-[0.8125rem] text-muted-foreground transition-colors duration-150';

const FIELD =
  'h-full min-w-0 bg-transparent text-[0.8125rem] text-foreground outline-none placeholder:text-muted-foreground';

/**
 * The last row of a list or of a group, to add a record there. With `action` it is a field: type
 * a name (and, with `extra`, a second value, such as a lead's company) and press Enter in either,
 * and the row waits for the server's answer: the list refreshes with the new record and a toast
 * says so, or the refusal shows under the row (the text stays, to fix): the name's own error,
 * else the action's message. Escape clears it. With `href` it is a link to the create form,
 * filled in for the group.
 * @param props Component props.
 * @param props.label What it adds, such as "Add company" (with the group: "Add company owned by
 *   Mia").
 * @param props.placeholder The field's text, when it has `action`.
 * @param props.extra A second, optional field: its label and its text.
 * @param props.action Creates the record from the name typed (and the second value, with `extra`).
 * @param props.href The create form.
 * @returns The row.
 */
export const InlineAddRow = (
  props: { label: string } & (
    | {
        placeholder: string;
        extra?: { label: string; placeholder: string };
        action: (name: string, extra?: string) => Promise<ActionResult>;
      }
    | { href: string }
  ),
) => {
  const t = useTranslations('ListToolbar');
  const settle = useSettle();
  const errorId = useId();
  const [name, setName] = useState('');
  const [extra, setExtra] = useState('');
  const [error, setError] = useState<string>();
  // What a success has to say (a lead added in New, not its group's status): no fault of a field.
  const [notice, setNotice] = useState<string>();
  const [isPending, startTransition] = useTransition();

  if ('href' in props) {
    return (
      <Link href={props.href} className={`${ROW} hover:bg-accent/60 hover:text-foreground`}>
        <PlusIcon aria-hidden="true" className="size-4" />
        {props.label}
      </Link>
    );
  }
  const { action } = props;
  const field = {
    autoComplete: 'off',
    // Read-only while the server answers: the focus stays for the next one.
    readOnly: isPending,
    'aria-busy': isPending || undefined,
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && !isPending) {
        setName('');
        setExtra('');
        setError(undefined);
        setNotice(undefined);
      }
      if (event.key !== 'Enter' || event.nativeEvent.isComposing || isPending) {
        return;
      }
      setNotice(undefined);
      const typed = name.trim();
      if (!typed) {
        setError(t('add_name_required'));
        return;
      }
      startTransition(async () => {
        const result = await settle(props.extra ? action(typed, extra.trim()) : action(typed));
        if (result.ok) {
          setName('');
          setExtra('');
          // Made, with something to say (a lead added in New, not its group's status), or said
          // aloud and seen when the new row lands off the page or the group.
          if (result.message) {
            setNotice(result.message);
          } else {
            toast.success(t('added', { name: typed }));
          }
        } else {
          setError(result.fieldErrors?.name ?? result.message ?? t('add_failed'));
        }
      });
    },
  };

  return (
    <div className="flex flex-col">
      <div className={`${ROW} focus-within:text-foreground hover:bg-accent/60`}>
        <label
          className={`flex h-full min-w-0 items-center gap-2 ${props.extra ? 'basis-72' : 'flex-1'}`}
        >
          {isPending ? (
            <LoaderCircleIcon aria-hidden="true" className="size-4 shrink-0 animate-spin" />
          ) : (
            <PlusIcon aria-hidden="true" className="size-4 shrink-0" />
          )}
          <input
            {...field}
            aria-label={props.label}
            value={name}
            placeholder={props.placeholder}
            // As the record's own field takes it.
            maxLength={200}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={`${FIELD} flex-1`}
            onChange={(event) => {
              setName(event.target.value);
              setError(undefined);
              setNotice(undefined);
            }}
          />
        </label>
        {props.extra && (
          <input
            {...field}
            aria-label={props.extra.label}
            value={extra}
            placeholder={props.extra.placeholder}
            maxLength={200}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={`${FIELD} flex-1 border-l border-rule pl-2`}
            onChange={(event) => {
              setExtra(event.target.value);
              setError(undefined);
              setNotice(undefined);
            }}
          />
        )}
        {name.trim() && !isPending && (
          <kbd aria-hidden="true" className="font-sans text-xs text-muted-foreground">
            {t('add_hint')}
          </kbd>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="px-3 pb-2 pl-9 text-[0.8125rem] text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="alert" className="px-3 pb-2 pl-9 text-[0.8125rem] text-muted-foreground">
          {notice}
        </p>
      )}
    </div>
  );
};

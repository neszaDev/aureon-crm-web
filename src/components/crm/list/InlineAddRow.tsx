'use client';

import { LoaderCircleIcon, PlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';
import type { ActionResult } from '@/libs/api/ApiError';
import { Link } from '@/libs/I18nNavigation';
import { useSettle } from '@/utils/SettleAction';

const ROW =
  'flex h-9 w-full items-center gap-2 px-3 text-[0.8125rem] text-muted-foreground transition-colors duration-150';

/**
 * The last row of a list or of a group, to add a record there. With `action` it is a field: type
 * a name and press Enter, and the row waits for the server's answer: the list refreshes with the
 * new record, or the refusal shows under the row (the text stays, to fix). Escape clears it. With
 * `href` it is a link to the create form, filled in for the group.
 * @param props Component props.
 * @param props.label What it adds, such as "Add company" (with the group: "Add company owned by
 *   Mia").
 * @param props.placeholder The field's text, when it has `action`.
 * @param props.action Creates the record from the name typed.
 * @param props.href The create form.
 * @returns The row.
 */
export const InlineAddRow = (
  props: { label: string } & (
    | { placeholder: string; action: (name: string) => Promise<ActionResult> }
    | { href: string }
  ),
) => {
  const t = useTranslations('ListToolbar');
  const settle = useSettle();
  const errorId = useId();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [added, setAdded] = useState('');
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

  return (
    <div className="flex flex-col">
      <label className={`${ROW} focus-within:text-foreground hover:bg-accent/60`}>
        {isPending ? (
          <LoaderCircleIcon aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <PlusIcon aria-hidden="true" className="size-4" />
        )}
        <input
          aria-label={props.label}
          value={name}
          placeholder={props.placeholder}
          // As the record's own field takes it.
          maxLength={200}
          autoComplete="off"
          // Read-only while the server answers: the focus stays for the next one.
          readOnly={isPending}
          aria-busy={isPending || undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-[0.8125rem] text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            setName(event.target.value);
            setError(undefined);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape' && !isPending) {
              setName('');
              setError(undefined);
            }
            if (event.key !== 'Enter' || event.nativeEvent.isComposing || isPending) {
              return;
            }
            const typed = name.trim();
            if (!typed) {
              setError(t('add_name_required'));
              return;
            }
            startTransition(async () => {
              const result = await settle(action(typed));
              if (result.ok) {
                setName('');
                setAdded(t('added', { name: typed }));
              } else {
                const fields = Object.values(result.fieldErrors ?? {});
                setError(
                  fields.length > 0 ? fields.join(' ') : (result.message ?? t('add_failed')),
                );
              }
            });
          }}
        />
        {name.trim() && !isPending && (
          <kbd aria-hidden="true" className="font-sans text-xs text-muted-foreground">
            {t('add_hint')}
          </kbd>
        )}
      </label>
      {error && (
        <p id={errorId} role="alert" className="px-3 pb-2 pl-9 text-[0.8125rem] text-destructive">
          {error}
        </p>
      )}
      <output className="sr-only">{added}</output>
    </div>
  );
};

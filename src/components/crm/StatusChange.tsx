'use client';

import { RotateCwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useLayoutEffect, useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import type { ActionResult } from '@/libs/api/ApiError';
import type { StatusTone } from '@/libs/crm/StatusColors';
import { useSettle } from '@/utils/SettleAction';

/**
 * A status pill's change, sent as it is: pending until the server answers (its refresh drawn),
 * then a toast for a change made, or the refusal kept for `StatusRefusal` with the old value still
 * shown. Never ahead of the server.
 * @param onRefused Called when a change is refused (`useKeptFocus`'s `release`).
 * @returns Whether a change is on its way, the last refusal, and `run`, which sends one (unless
 *   one is on its way) and toasts `done` once it is made.
 */
export const useStatusChange = (onRefused?: () => void) => {
  const settle = useSettle();
  const [failure, setFailure] = useState<ActionResult>();
  const [isPending, startTransition] = useTransition();
  const run = (change: () => Promise<ActionResult>, done: string) => {
    if (isPending) {
      return;
    }
    startTransition(async () => {
      setFailure(undefined);
      const result = await settle(change());
      if (result.ok) {
        toast.success(done);
      } else {
        onRefused?.();
        setFailure(result);
      }
    });
  };

  return { isPending, failure, run };
};

/** What holds a record's pill: the record's panel (a dialog), or the page behind it. */
export const PILL_SCOPE = '[role="dialog"], #crm-main';

/**
 * A record's pill, by its key, in what holds it: the panel's or the page's, never the other's.
 * @param scope The panel or the page, if it is still there; else the document.
 * @param key The record, such as `lead-42`.
 * @returns The pill's button, if it is there.
 */
export const pillIn = (scope: ParentNode, key: string) =>
  (scope instanceof Node && !scope.isConnected ? document : scope).querySelector<HTMLElement>(
    `[data-pill="${CSS.escape(key)}"] button`,
  );

/**
 * Keeps the focus on a record's pill when a new status moves its row to another section: the row
 * is drawn anew there, in the same commit that closes the pill's menu, so the focus falls to the
 * page; the new pill takes it back. Only for a pill whose menu was used (`markUsed`) or that held
 * the focus, and only while nothing else has it, in the list or the panel it was in. Its cell
 * carries `data-pill`. A change that
 * doesn't happen (refused, or its dialog cancelled) calls `release`, so a later redraw leaves the
 * focus alone.
 * @param key The record, such as `lead-42`.
 * @returns The ref for the pill's cell, `markUsed`, for its menu's choices, and `release`.
 */
export const useKeptFocus = (key: string) => {
  const cell = useRef<HTMLDivElement>(null);
  // A layout cleanup runs while the old pill is still on the page.
  useLayoutEffect(() => {
    const node = cell.current;
    return () => {
      if (node?.dataset.used === 'true' || node?.contains(document.activeElement)) {
        // Where the pill was, the list or the record's panel: both may show the record's pill.
        const scope = node.closest(PILL_SCOPE) ?? document;
        setTimeout(() => {
          if (document.activeElement === document.body) {
            pillIn(scope, key)?.focus();
          }
        }, 0);
      }
    };
  }, [key]);
  const markUsed = () => {
    if (cell.current) {
      cell.current.dataset.used = 'true';
    }
  };
  const release = () => {
    if (cell.current) {
      delete cell.current.dataset.used;
    }
  };

  return [cell, markUsed, release] as const;
};

/**
 * A refused status change under its pill, in words: what the server said (else `fallback`), and a
 * reload when someone changed the record first.
 * @param props Component props.
 * @param props.failure The refusal, if any.
 * @param props.fallback The message without one from the server.
 * @returns The alert, or nothing.
 */
export const StatusRefusal = (props: { failure?: ActionResult; fallback: string }) => {
  const t = useTranslations('ActionError');
  if (!props.failure) {
    return null;
  }

  return (
    <p
      role="alert"
      className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] leading-snug text-destructive"
    >
      {props.failure.message ?? props.fallback}
      {props.failure.conflict && (
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => {
            window.location.reload();
          }}
        >
          <RotateCwIcon data-icon="inline-start" />
          {t('reload')}
        </Button>
      )}
    </p>
  );
};

/**
 * A status a pill's menu moves to: its dot in its colour, and its name.
 * @param props Component props.
 * @param props.tone Its colour.
 * @param props.label Its name.
 * @param props.onSelect Moves to it.
 * @returns The menu item.
 */
export const StatusOption = (props: { tone: StatusTone; label: string; onSelect: () => void }) => (
  <DropdownMenuItem data-tone={props.tone} onSelect={props.onSelect}>
    <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-(--tone)" />
    {props.label}
  </DropdownMenuItem>
);

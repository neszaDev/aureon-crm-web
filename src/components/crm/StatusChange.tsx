'use client';

import { RotateCwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
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
 * @returns Whether a change is on its way, the last refusal, and `run`, which sends one (unless
 *   one is on its way) and toasts `done` once it is made.
 */
export const useStatusChange = () => {
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
        setFailure(result);
      }
    });
  };

  return { isPending, failure, run };
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

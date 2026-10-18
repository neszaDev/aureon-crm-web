'use client';

import { ArchiveIcon, ArchiveRestoreIcon, LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/libs/api/ApiError';
import { focusOnMount } from '@/utils/Focus';
import { useSettle } from '@/utils/SettleAction';

/**
 * Archives a record after a confirmation (a refusal shows in the dialog), or restores an archived
 * one at once (a refusal shows in a toast). Success says so in a toast, and the focus moves to
 * the button that undoes it.
 * @param props Component props.
 * @param props.id The restore button's id.
 * @param props.name The record's name, for the confirmation and the toasts.
 * @param props.archived Whether the record is archived.
 * @param props.archive Archives it.
 * @param props.restore Restores it.
 * @returns The button, with its dialog.
 */
export const ArchiveButton = (props: {
  id: string;
  name: string;
  archived: boolean;
  archive: () => Promise<ActionResult>;
  restore: () => Promise<ActionResult>;
}) => {
  const t = useTranslations('RecordActions');
  const settle = useSettle();
  const [isPending, startTransition] = useTransition();
  // After a restore, the Archive button that replaces Restore takes the focus.
  const [restored, setRestored] = useState(false);

  return (
    <>
      {props.archived && (
        <Button
          id={props.id}
          variant="outline"
          // aria-disabled, not disabled: a disabled button drops the focus to the page.
          aria-disabled={isPending || undefined}
          onClick={() => {
            if (isPending) {
              return;
            }
            startTransition(async () => {
              const result = await settle(props.restore());
              if (result.ok) {
                setRestored(true);
                toast.success(t('restored', { name: props.name }));
              } else {
                toast.error(result.message ?? t('error_generic'));
              }
            });
          }}
        >
          {isPending ? (
            <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
          ) : (
            <ArchiveRestoreIcon data-icon="inline-start" />
          )}
          {t('restore')}
        </Button>
      )}
      {/* Mounted in both states, so the dialog closes (and hands the focus on) once archived. */}
      <ConfirmAction
        trigger={
          props.archived ? undefined : (
            <Button ref={restored ? focusOnMount : undefined} variant="outline">
              <ArchiveIcon data-icon="inline-start" />
              {t('archive')}
            </Button>
          )
        }
        title={t('archive_title', { name: props.name })}
        description={t('archive_text')}
        confirmLabel={t('archive_confirm')}
        cancelLabel={t('cancel')}
        fallbackFocus={() => document.querySelector<HTMLElement>(`#${CSS.escape(props.id)}`)}
        action={async () => {
          const result = await props.archive();
          if (result.ok) {
            toast.success(t('archived', { name: props.name }));
          }
          return result;
        }}
      />
    </>
  );
};

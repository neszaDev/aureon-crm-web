'use client';

import { ArchiveIcon, ArchiveRestoreIcon, EllipsisIcon, LoaderCircleIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { ConfirmAction } from '@/components/crm/ConfirmAction';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ActionResult } from '@/libs/api/ApiError';
import { useSettle } from '@/utils/SettleAction';

/**
 * A list row's "…" menu: Archive (after a confirmation, whose dialog shows a refusal) or, in the
 * archived view, Restore (a refusal in a toast). Each waits for the server; the list then
 * refreshes without the row, and the focus goes to the page. From 768 px on a device that can
 * hover it shows on the row's hover or focus.
 * @param props Component props.
 * @param props.name The record's name, for the menu's label, the confirmation and the toasts.
 * @param props.archived Whether the record is archived.
 * @param props.archive Archives it.
 * @param props.restore Restores it.
 * @returns The menu.
 */
export const RowMenu = (props: {
  name: string;
  archived: boolean;
  archive: () => Promise<ActionResult>;
  restore: () => Promise<ActionResult>;
}) => {
  const t = useTranslations('RecordActions');
  const tList = useTranslations('ListToolbar');
  const settle = useSettle();
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const trigger = useRef<HTMLButtonElement>(null);
  // Archived, the row is gone once the dialog closes: then the page takes the focus.
  const focusTarget = () =>
    trigger.current?.isConnected ? trigger.current : document.querySelector<HTMLElement>('main');

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={trigger}
            variant="ghost"
            size="icon-xs"
            aria-label={tList('row_menu', { name: props.name })}
            aria-disabled={isPending || undefined}
            // A phone's control is 36 px.
            className="aria-expanded:opacity-100 max-sm:size-9 md:group-focus-within/row:opacity-100 md:group-hover/row:opacity-100 max-sm:[&_svg]:size-4 [@media(hover:hover)]:md:opacity-0"
          >
            {isPending ? <LoaderCircleIcon className="animate-spin" /> : <EllipsisIcon />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-auto min-w-36">
          {props.archived ? (
            <DropdownMenuItem
              disabled={isPending}
              onSelect={() => {
                startTransition(async () => {
                  const result = await settle(props.restore());
                  if (result.ok) {
                    toast.success(t('restored', { name: props.name }));
                    // Restored, it leaves the archived view.
                    document.querySelector<HTMLElement>('main')?.focus();
                  } else {
                    toast.error(result.message ?? t('error_generic'));
                  }
                });
              }}
            >
              <ArchiveRestoreIcon />
              {t('restore')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onSelect={() => {
                setConfirming(true);
              }}
            >
              <ArchiveIcon />
              {t('archive')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmAction
        open={confirming}
        onOpenChange={setConfirming}
        returnFocus={focusTarget}
        title={t('archive_title', { name: props.name })}
        description={t('archive_text')}
        confirmLabel={t('archive_confirm')}
        cancelLabel={t('cancel')}
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

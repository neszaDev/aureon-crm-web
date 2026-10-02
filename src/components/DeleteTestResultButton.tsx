'use client';

import { LoaderCircleIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { deleteTestResult } from '@/actions/TestResultActions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

export const DeleteTestResultButton = (props: { id: number; name: string }) => {
  const t = useTranslations('TestResultsPage');
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          className="text-ink-600 hover:bg-pen/10 hover:text-pen"
          size="sm"
          aria-label={t('delete_label', { name: props.name })}
        >
          <Trash2Icon data-icon="inline-start" />
          <span className="max-md:sr-only">{t('delete_button')}</span>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirm_title', { name: props.name })}</AlertDialogTitle>
          <AlertDialogDescription>{t('confirm_text')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('confirm_cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              // Keep the dialog open until the row is gone.
              event.preventDefault();
              startTransition(async () => {
                await deleteTestResult(props.id);
                setOpen(false);
              });
            }}
          >
            {isPending && <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />}
            {t('confirm_delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

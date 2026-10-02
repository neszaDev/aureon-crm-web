'use client';

import { LoaderCircleIcon, Trash2Icon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { deleteUser } from '@/actions/UserActions';
import { FormAlert } from '@/components/FormAlert';
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

/**
 * Deletes a user after confirmation; on success the action returns to the users list.
 * @param props Component props.
 * @param props.id User id.
 * @param props.email User email, named in the dialog.
 * @returns The button and its dialog.
 */
export const DeleteUserButton = (props: { id: number; email: string }) => {
  const t = useTranslations('UserForm');
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">
          <Trash2Icon data-icon="inline-start" />
          {t('delete_button')}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('confirm_title', { email: props.email })}</AlertDialogTitle>
          <AlertDialogDescription>{t('confirm_text')}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && <FormAlert>{error}</FormAlert>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{t('confirm_cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={(event) => {
              // Keep the dialog open until the action redirects (or fails).
              event.preventDefault();
              setError(undefined);
              startTransition(async () => {
                const result = await deleteUser(props.id);
                setError(result.message);
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

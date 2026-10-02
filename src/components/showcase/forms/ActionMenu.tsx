'use client';

import { ChevronDownIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ActionItems = () => {
  const t = useTranslations('BasicFormsPage');

  return (
    <>
      <DropdownMenuItem>{t('action')}</DropdownMenuItem>
      <DropdownMenuItem>{t('another_action')}</DropdownMenuItem>
      <DropdownMenuItem>{t('something_else')}</DropdownMenuItem>
      <DropdownMenuItem disabled>{t('disabled_action')}</DropdownMenuItem>
    </>
  );
};

/**
 * The "Action" dropdown attached to an input group, or a split button ("Split" plus a caret that
 * opens the menu) when `split` is set.
 * @param props Component props.
 * @param props.align Which edge of the trigger the menu lines up with.
 * @param props.split Render a split button instead of a single trigger.
 * @returns The dropdown.
 */
export const ActionMenu = (props: { align?: 'start' | 'end'; split?: boolean }) => {
  const t = useTranslations('BasicFormsPage');

  return (
    <DropdownMenu>
      {props.split ? (
        <div className="flex">
          <Button type="button" size="sm" className="rounded-r-none">
            {t('split')}
          </Button>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon-sm"
              className="rounded-l-none border-l border-folder-deep"
              aria-label={t('more_actions')}
            >
              <ChevronDownIcon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </div>
      ) : (
        <DropdownMenuTrigger asChild>
          <Button type="button" size="sm">
            {t('action')}
            <ChevronDownIcon aria-hidden="true" data-icon="inline-end" />
          </Button>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align={props.align ?? 'start'} className="w-48">
        <ActionItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

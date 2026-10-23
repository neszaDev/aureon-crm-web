'use client';

import { MessageSquarePlusIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

/**
 * The record header's "Log activity": opens the composer at the top of the record's activity
 * (its own button there, `data-log-activity`), which takes the focus and scrolls into view; when
 * the composer is open already, its Subject takes the focus.
 * @returns The button.
 */
export const LogActivityButton = () => {
  const t = useTranslations('ActivityTimeline');

  return (
    <Button
      variant="outline"
      onClick={(event) => {
        const record = event.currentTarget.closest('[data-record]');
        const opener = record?.querySelector<HTMLElement>('[data-log-activity]');
        if (opener) {
          opener.click();
        } else {
          record?.querySelector<HTMLElement>('input[name="subject"]')?.focus();
        }
      }}
    >
      <MessageSquarePlusIcon data-icon="inline-start" />
      {t('log')}
    </Button>
  );
};

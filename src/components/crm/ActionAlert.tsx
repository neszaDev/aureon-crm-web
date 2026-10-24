'use client';

import { RotateCwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FormAlert } from '@/components/FormAlert';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/libs/api/ApiError';

/**
 * A failed action's message at the top of a form. A version conflict (someone else saved first)
 * adds a reload, which shows their version.
 * @param props Component props.
 * @param props.result The action's result; nothing shows without a message.
 * @returns The alert, or nothing.
 */
export const ActionAlert = (props: { result?: ActionResult }) => {
  const t = useTranslations('ActionError');
  if (!props.result?.message) {
    return null;
  }

  return (
    <FormAlert>
      <span className="flex flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        {props.result.message}
        {props.result.conflict && (
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
      </span>
    </FormAlert>
  );
};

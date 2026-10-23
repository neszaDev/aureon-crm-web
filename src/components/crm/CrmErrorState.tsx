'use client';

import { CircleAlertIcon, RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CrmState } from '@/components/crm/CrmState';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

/**
 * What a CRM error boundary shows (`CrmState`): what happened, on the danger tint, a retry, and
 * the way back to the workspace list.
 * @param props Component props.
 * @param props.retry Loads the failed segment again.
 * @returns The error state.
 */
export const CrmErrorState = (props: { retry: () => void }) => {
  const t = useTranslations('ErrorPage');
  const tShell = useTranslations('CrmShell');

  return (
    <CrmState
      role="alert"
      icon={CircleAlertIcon}
      danger
      heading
      title={t('title')}
      text={t('text')}
      className="mx-auto w-full max-w-lg"
    >
      <Button
        onClick={() => {
          props.retry();
        }}
      >
        <RotateCcwIcon data-icon="inline-start" />
        {t('retry')}
      </Button>
      <Button asChild variant="outline">
        <Link href="/app">{tShell('all_workspaces')}</Link>
      </Button>
    </CrmState>
  );
};

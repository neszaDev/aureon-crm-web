'use client';

import { CircleAlertIcon, RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

/**
 * What a CRM error boundary shows: what happened, in crimson with its icon (never the seal's
 * vermilion), a retry, and the way back to the workspace list.
 * @param props Component props.
 * @param props.retry Loads the failed segment again.
 * @returns The error panel.
 */
export const CrmErrorState = (props: { retry: () => void }) => {
  const t = useTranslations('ErrorPage');
  const tShell = useTranslations('CrmShell');

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-start gap-4 rounded-lg border border-rule bg-card p-6 shadow-sheet sm:p-8"
    >
      <CircleAlertIcon aria-hidden="true" className="size-7 text-danger" />
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('text')}</p>
      </div>
      <div className="flex flex-wrap gap-3">
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
      </div>
    </div>
  );
};

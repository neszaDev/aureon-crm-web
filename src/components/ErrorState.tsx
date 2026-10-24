'use client';

import { CircleAlertIcon, RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CrmState } from '@/components/crm/CrmState';
import { PUBLIC_CARD } from '@/components/PublicFrame';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

/**
 * What an error boundary shows (`CrmState`, on a card): what happened, on the danger tint, a way
 * to retry, and the way home.
 * @param props Component props.
 * @param props.retry Re-renders the failed segment.
 * @param props.homeHref Where "Back to home" goes.
 * @returns The error message.
 */
export const ErrorState = (props: { retry: () => void; homeHref?: string }) => {
  const t = useTranslations('ErrorPage');

  return (
    <CrmState
      role="alert"
      icon={CircleAlertIcon}
      danger
      heading
      title={t('title')}
      text={t('text')}
      className={`${PUBLIC_CARD} mx-auto`}
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
        <Link href={props.homeHref ?? '/'}>{t('home')}</Link>
      </Button>
    </CrmState>
  );
};

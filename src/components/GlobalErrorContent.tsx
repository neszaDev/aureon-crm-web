'use client';

import { CircleAlertIcon, RotateCcwIcon } from 'lucide-react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { CrmState } from '@/components/crm/CrmState';
import { PUBLIC_CARD, PublicFrame } from '@/components/PublicFrame';
import { Button } from '@/components/ui/button';
import { routing } from '@/libs/I18nRouting';
import messages from '@/locales/en.json';

const Content = (props: { retry: () => void }) => {
  const t = useTranslations('GlobalError');

  return (
    <PublicFrame>
      <title>{t('title')}</title>
      <CrmState
        role="alert"
        icon={CircleAlertIcon}
        danger
        heading
        title={t('title')}
        text={t('text')}
        className={PUBLIC_CARD}
      >
        <Button
          onClick={() => {
            props.retry();
          }}
        >
          <RotateCcwIcon data-icon="inline-start" />
          {t('retry')}
        </Button>
      </CrmState>
    </PublicFrame>
  );
};

/**
 * What the global error page shows, in the default locale: the public pages' frame and a card
 * saying the app hit an error it couldn't recover from, with a retry.
 * @param props Component props.
 * @param props.retry Renders the app again.
 * @returns The page's body.
 */
export const GlobalErrorContent = (props: { retry: () => void }) => (
  <NextIntlClientProvider locale={routing.defaultLocale} messages={messages}>
    <Content retry={props.retry} />
  </NextIntlClientProvider>
);

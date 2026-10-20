'use client';

import { CircleAlertIcon, RotateCcwIcon } from 'lucide-react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { PublicFrame } from '@/components/PublicFrame';
import { Button } from '@/components/ui/button';
import { routing } from '@/libs/I18nRouting';
import messages from '@/locales/en.json';

const Content = (props: { retry: () => void }) => {
  const t = useTranslations('GlobalError');

  return (
    <PublicFrame>
      <title>{t('title')}</title>
      <div
        role="alert"
        className="flex w-full max-w-lg flex-col items-start gap-6 rounded-lg border border-rule bg-card p-6 shadow-sheet sm:p-8"
      >
        <CircleAlertIcon aria-hidden="true" className="size-7 text-danger" />
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl leading-[1.2] font-extrabold tracking-[-0.03em]">{t('title')}</h1>
          <p className="max-w-[65ch] text-muted-foreground">{t('text')}</p>
        </div>
        <Button
          onClick={() => {
            props.retry();
          }}
        >
          <RotateCcwIcon data-icon="inline-start" />
          {t('retry')}
        </Button>
      </div>
    </PublicFrame>
  );
};

/**
 * What the global error page shows, in the default locale: the public pages' bar and a card
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

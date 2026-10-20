'use client';

import '@/styles/global.css';
import { CircleAlertIcon, RotateCcwIcon } from 'lucide-react';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { PublicFrame } from '@/components/PublicFrame';
import { Button } from '@/components/ui/button';
import { routing } from '@/libs/I18nRouting';
import { THEME_SCRIPT } from '@/libs/Theme';
import messages from '@/locales/en.json';

const GlobalErrorContent = (props: { retry: () => void }) => {
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

// Replaces the root layout, so it brings its own document, theme and intl provider (default
// locale), and draws the public pages' bar and card.
export default function GlobalError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang={routing.defaultLocale} suppressHydrationWarning>
      <head>
        <script
          // A constant script with no user input; Theme.test.ts proves it applies only light|dark.
          // oxlint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
      </head>
      <body>
        <NextIntlClientProvider locale={routing.defaultLocale} messages={messages}>
          <GlobalErrorContent retry={props.retry} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

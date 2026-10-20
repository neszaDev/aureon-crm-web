'use client';

import { CircleAlertIcon, RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

/**
 * What an error boundary shows: what happened, in crimson with its icon (never the seal's
 * vermilion), a way to retry, and the way home, on a card.
 * @param props Component props.
 * @param props.retry Re-renders the failed segment.
 * @param props.homeHref Where "Back to home" goes.
 * @returns The error message.
 */
export const ErrorState = (props: { retry: () => void; homeHref?: string }) => {
  const t = useTranslations('ErrorPage');

  return (
    <div
      role="alert"
      className="mx-auto flex w-full max-w-lg flex-col items-start gap-6 rounded-lg border border-rule bg-card p-6 shadow-sheet sm:p-8"
    >
      <CircleAlertIcon aria-hidden="true" className="size-7 text-danger" />
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl leading-[1.2] font-extrabold tracking-[-0.03em]">{t('title')}</h1>
        <p className="max-w-[65ch] text-muted-foreground">{t('text')}</p>
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
          <Link href={props.homeHref ?? '/'}>{t('home')}</Link>
        </Button>
      </div>
    </div>
  );
};

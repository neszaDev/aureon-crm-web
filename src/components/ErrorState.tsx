'use client';

import { RotateCcwIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Mark } from '@/components/report/Mark';
import { Button } from '@/components/ui/button';
import { Link } from '@/libs/I18nNavigation';

/**
 * What an error boundary shows: the failed mark, what happened, and a way to retry.
 * @param props Component props.
 * @param props.retry Re-renders the failed segment.
 * @param props.homeHref Where "Back to home" goes.
 * @returns The error message.
 */
export const ErrorState = (props: { retry: () => void; homeHref?: string }) => {
  const t = useTranslations('ErrorPage');

  return (
    <div role="alert" className="paper mx-auto flex max-w-lg flex-col items-start gap-5 p-8">
      <Mark status="FAILED" className="size-12" />
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink-950">{t('title')}</h1>
        <p className="leading-relaxed text-ink-600">{t('text')}</p>
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

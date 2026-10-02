'use client';

import '@/styles/global.css';
import { NextIntlClientProvider, useTranslations } from 'next-intl';
import { routing } from '@/libs/I18nRouting';
import messages from '@/locales/en.json';

const GlobalErrorContent = (props: { retry: () => void }) => {
  const t = useTranslations('GlobalError');

  return (
    <main className="paper flex max-w-md flex-col items-start gap-4 p-8">
      <title>{t('title')}</title>
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink-950">{t('title')}</h1>
      <p className="leading-relaxed text-ink-600">{t('text')}</p>
      <button
        type="button"
        onClick={() => {
          props.retry();
        }}
        className="h-9 rounded-md bg-folder px-4 text-sm font-semibold text-folder-ink hover:bg-folder-deep"
      >
        {t('retry')}
      </button>
    </main>
  );
};

// Replaces the root layout, so it brings its own document and intl provider (default locale).
export default function GlobalError(props: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang={routing.defaultLocale}>
      <body className="grid min-h-dvh place-items-center bg-paper px-4 font-sans text-ink-900">
        <NextIntlClientProvider locale={routing.defaultLocale} messages={messages}>
          <GlobalErrorContent retry={props.retry} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

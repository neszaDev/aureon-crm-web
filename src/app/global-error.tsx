'use client';

import '@/styles/global.css';
import type { ComponentType } from 'react';
import { lazy, Suspense } from 'react';
import { AureonMark } from '@/components/brand/AureonMark';
import { routing } from '@/libs/I18nRouting';
import { THEME_SCRIPT } from '@/libs/Theme';

/**
 * The card shown while the page's content loads, and instead of it when it can't (offline, or a
 * redeploy removed its chunk: the usual reason the root layout failed). It carries no message
 * file, so it says what to do in each of the app's languages at once (it can't know the page's),
 * and its button reloads the page, which fetches the app anew.
 * @returns The page's body.
 */
const StaticFallback = () => (
  <div className="flex min-h-dvh flex-col bg-background">
    {/* The public pages' frame (`PublicFrame`): the brand's name is the same in every language. */}
    <header className="flex h-16 items-center px-4 sm:px-8">
      <span className="inline-flex items-center gap-2 text-xl font-semibold tracking-[-0.02em]">
        <AureonMark className="size-6 shrink-0 text-violet-ink" />
        Aureon
      </span>
    </header>
    <main className="flex flex-1 items-start justify-center px-4 pt-10 pb-16 sm:items-center sm:pt-16">
      <div
        role="alert"
        className="flex w-full max-w-lg flex-col items-start gap-4 rounded-lg border border-rule bg-card p-6 sm:p-8"
      >
        <h1 className="text-[1.25rem] leading-7 font-semibold tracking-[-0.01em]">
          <span lang="en">Something went wrong</span>
        </h1>
        <p className="flex flex-col gap-1 text-sm text-muted-foreground">
          <span lang="en">The app hit an error. Reload the page.</span>
          <span lang="fr">Une erreur est survenue. Rechargez la page.</span>
          <span lang="th">เกิดข้อผิดพลาด โปรดโหลดหน้านี้ใหม่</span>
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.reload();
          }}
          className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-violet-hover focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <span lang="en">Reload</span>&nbsp;·&nbsp;<span lang="fr">Recharger</span>&nbsp;·&nbsp;
          <span lang="th">โหลดใหม่</span>
        </button>
      </div>
    </main>
  </div>
);

// Loaded only when it shows: imported here, every page would carry all its messages and parts.
// A chunk that can't be fetched falls back to the static card rather than a blank page.
const GlobalErrorContent = lazy<ComponentType<{ retry: () => void }>>(async () => {
  try {
    const content = await import('@/components/GlobalErrorContent');

    return { default: content.GlobalErrorContent };
  } catch {
    return { default: StaticFallback };
  }
});

// Replaces the root layout, so it brings its own document and theme, and draws the public pages'
// frame and card.
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
        <Suspense fallback={<StaticFallback />}>
          <GlobalErrorContent retry={props.retry} />
        </Suspense>
      </body>
    </html>
  );
}

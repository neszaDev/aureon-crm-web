'use client';

import '@/styles/global.css';
import type { ComponentType } from 'react';
import { lazy, Suspense } from 'react';
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
  <main className="grid min-h-dvh place-items-center bg-background px-4 py-16">
    <div
      role="alert"
      className="flex w-full max-w-lg flex-col items-start gap-5 rounded-lg border border-rule bg-card p-6 shadow-sheet sm:p-8"
    >
      <h1 className="text-2xl font-bold">
        <span lang="en">Something went wrong</span>
      </h1>
      <p className="flex flex-col gap-1 text-muted-foreground">
        <span lang="en">The app hit an error. Reload the page.</span>
        <span lang="fr">Une erreur est survenue. Rechargez la page.</span>
        <span lang="th">เกิดข้อผิดพลาด โปรดโหลดหน้านี้ใหม่</span>
      </p>
      <button
        type="button"
        onClick={() => {
          window.location.reload();
        }}
        className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-ply hover:bg-seal-deep focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        <span lang="en">Reload</span>&nbsp;·&nbsp;<span lang="fr">Recharger</span>&nbsp;·&nbsp;
        <span lang="th">โหลดใหม่</span>
      </button>
    </div>
  </main>
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
// bar and card.
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

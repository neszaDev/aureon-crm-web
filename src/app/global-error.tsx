'use client';

import '@/styles/global.css';
import { lazy, Suspense } from 'react';
import { routing } from '@/libs/I18nRouting';
import { THEME_SCRIPT } from '@/libs/Theme';

// Loaded only when it shows: imported here, every page would carry all its messages and parts.
const GlobalErrorContent = lazy(async () => {
  const content = await import('@/components/GlobalErrorContent');

  return { default: content.GlobalErrorContent };
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
        <Suspense>
          <GlobalErrorContent retry={props.retry} />
        </Suspense>
      </body>
    </html>
  );
}

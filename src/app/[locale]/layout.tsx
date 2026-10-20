import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Anuphan } from 'next/font/google';
import { notFound } from 'next/navigation';
import { ThemeClass } from '@/components/ThemeClass';
import { routing } from '@/libs/I18nRouting';
import { THEME_GROUNDS, THEME_SCRIPT } from '@/libs/Theme';
import { getBaseUrl } from '@/utils/Helpers';
import '@/styles/global.css';

// Anuphan sets Latin and Thai alike, self-hosted by next/font at build (the demos' Kalam is in
// their own layout).
const anuphan = Anuphan({
  // The subsets preloaded on every page; latin-ext (œ and rarer letters) still loads when a page
  // draws one of its letters.
  subsets: ['latin', 'thai'],
  variable: '--font-anuphan',
  display: 'swap',
});

export const metadata: Metadata = {
  // Makes the Open Graph image's URL absolute. A Docker build runs without APP_URL (validation
  // skipped), hence the fallback.
  metadataBase: new URL(getBaseUrl() || 'http://localhost:3000'),
  icons: [
    {
      rel: 'apple-touch-icon',
      url: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      url: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      url: '/favicon-16x16.png',
    },
    {
      rel: 'icon',
      url: '/favicon.ico',
    },
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // The ground of each OS scheme; `applyTheme` follows a theme chosen in the app instead.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: THEME_GROUNDS.light },
    { media: '(prefers-color-scheme: dark)', color: THEME_GROUNDS.dark },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await props.params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  // The public pages' client components translate only these (the error page draws the
  // wordmark): their HTML stays light. Each signed-in area's layout gives its own provider every
  // message.
  const { ErrorPage, LocaleSwitcher, Brand } = await getMessages();

  // The theme class comes from the cookie in the browser (THEME_SCRIPT, before the first paint),
  // so pages stay static; the server renders none, hence suppressHydrationWarning.
  return (
    <html lang={locale} className={anuphan.variable} suppressHydrationWarning>
      <head>
        <script
          // A constant script with no user input; Theme.test.ts proves it applies only light|dark.
          // oxlint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
      </head>
      <body>
        <ThemeClass />
        <NextIntlClientProvider messages={{ ErrorPage, LocaleSwitcher, Brand }}>
          {props.children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

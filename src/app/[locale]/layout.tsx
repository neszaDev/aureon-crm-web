import type { Metadata, Viewport } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { Anuphan, Inter } from 'next/font/google';
import { notFound } from 'next/navigation';
import { ThemeClass } from '@/components/ThemeClass';
import { SIDEBAR_SCRIPT } from '@/libs/crm/Sidebar';
import { routing } from '@/libs/I18nRouting';
import { THEME_CANVAS, THEME_SCRIPT } from '@/libs/Theme';
import { getBaseUrl } from '@/utils/Helpers';
import '@/styles/global.css';

// Inter sets the UI and Anuphan the Thai Inter lacks (one stack, `--font-sans`), both self-hosted
// by next/font at build; the demos' Kalam is in their own layout. The subsets are the ones
// preloaded on every page; latin-ext (œ and rarer letters) still loads when a page draws one.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const anuphan = Anuphan({
  subsets: ['thai'],
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

// The browser's bar colour (`theme-color`) is in the layout's <head>, not here: Next draws the
// viewport's tags again on every navigation, which would undo a theme chosen in the app.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
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
  // so pages stay static; the server renders none, hence suppressHydrationWarning. The CRM
  // sidebar's stored width is put there the same way (SIDEBAR_SCRIPT), on every page, so a
  // client navigation into a workspace finds it too.
  return (
    <html
      lang={locale}
      className={`${inter.variable} ${anuphan.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* The canvas of each OS scheme; `applyTheme` sets both to a theme chosen in the app. */}
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content={THEME_CANVAS.light}
        />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content={THEME_CANVAS.dark} />
        <script
          // A constant script with no user input; Theme.test.ts proves it applies only light|dark.
          // oxlint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }}
        />
        <script
          // A constant script with no user input: it puts only `collapsed` or `expanded` on <html>.
          // oxlint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: SIDEBAR_SCRIPT }}
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
